import cron from 'node-cron'
import { prisma } from '../config/prisma'
import { fetchPncpToday } from '../modules/apis/pncp'
import { sendEmail } from '../utils/email'

export function startAlertJob() {
  // Runs daily at 23:00
  cron.schedule('0 23 * * *', async () => {
    console.log('[AlertJob] Checking PNCP for new licitações...')
    try {
      const result = await fetchPncpToday()
      const items = ((result.data as { data?: unknown[] }).data ?? []) as Record<string, unknown>[]

      const activeAlerts = await prisma.alert.findMany({
        where: { isActive: true },
        include: { user: { select: { email: true, name: true } } },
      })

      for (const alert of activeAlerts) {
        const matches = items.filter((item) => {
          const title = String(item.objetoCompra ?? '').toLowerCase()
          const uf = String(item.uf ?? '')
          const value = Number(item.valorTotalEstimado ?? 0)

          const keywordMatch = alert.keywords.length === 0 || alert.keywords.some((kw) => title.includes(kw.toLowerCase()))
          const stateMatch = alert.states.length === 0 || alert.states.includes(uf)
          const minMatch = !alert.minValue || value >= alert.minValue
          const maxMatch = !alert.maxValue || value <= alert.maxValue

          return keywordMatch && stateMatch && minMatch && maxMatch
        })

        for (const match of matches) {
          const externalId = String(match.numeroControlePNCP ?? match.id ?? Math.random())
          try {
            await prisma.alertMatch.create({
              data: {
                alertId: alert.id,
                externalId,
                title: String(match.objetoCompra ?? ''),
                entity: String(match.razaoSocialOrgao ?? ''),
                value: Number(match.valorTotalEstimado ?? 0),
                state: String(match.uf ?? ''),
                publishedAt: new Date(),
              },
            })
          } catch {
            // Unique constraint — already matched
          }
        }

        if (matches.length > 0) {
          await sendEmail(
            alert.user.email,
            `[EBR] ${matches.length} nova(s) licitação(ões) — Alerta: ${alert.name}`,
            `<p>Olá, ${alert.user.name}!</p><p>Seu alerta <strong>${alert.name}</strong> identificou ${matches.length} nova(s) licitação(ões).</p>`,
          )
        }

        await prisma.alert.update({
          where: { id: alert.id },
          data: { lastCheckedAt: new Date() },
        })
      }

      console.log(`[AlertJob] Done. Checked ${activeAlerts.length} alerts against ${items.length} items.`)
    } catch (err) {
      console.error('[AlertJob] Error:', err)
    }
  })
}
