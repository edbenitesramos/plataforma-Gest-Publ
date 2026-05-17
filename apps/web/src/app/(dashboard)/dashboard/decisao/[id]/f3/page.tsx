'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import toast from 'react-hot-toast'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const fetcher = (url: string) => api.get(url)

interface Alternative {
  id?: string
  label: string
  description: string
  pros: string
  cons: string
  risk: string
  cost: string
  note: number
  isRecommended: boolean
  sortOrder: number
}

const emptyAlt = (): Alternative => ({
  label: '', description: '', pros: '', cons: '', risk: 'MEDIUM', cost: 'MEDIUM', note: 3, isRecommended: false, sortOrder: 0,
})

const RISK_COST_OPTS = [
  { value: 'LOW', label: 'Baixo' },
  { value: 'MEDIUM', label: 'Médio' },
  { value: 'HIGH', label: 'Alto' },
]

export default function F3Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: caseData } = useSWR(`/api/decision/${id}`, fetcher)
  const existing = (caseData as { f3Alternatives?: Alternative[] } | undefined)?.f3Alternatives

  const [alternatives, setAlternatives] = useState<Alternative[]>([
    { ...emptyAlt(), label: 'Opção A', sortOrder: 0 },
    { ...emptyAlt(), label: 'Opção B', sortOrder: 1 },
    { ...emptyAlt(), label: 'Não agir (status quo)', sortOrder: 99 },
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing && existing.length > 0) setAlternatives(existing)
  }, [existing])

  const addAlt = () => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F']
    const next = alternatives.filter((a) => a.label !== 'Não agir (status quo)').length
    const newAlt = { ...emptyAlt(), label: `Opção ${labels[next] ?? next + 1}`, sortOrder: next }
    const statusQuo = alternatives.find((a) => a.label === 'Não agir (status quo)')
    const rest = alternatives.filter((a) => a.label !== 'Não agir (status quo)')
    setAlternatives([...rest, newAlt, ...(statusQuo ? [statusQuo] : [])])
  }

  const removeAlt = (i: number) => {
    if (alternatives[i].label === 'Não agir (status quo)') return
    setAlternatives(alternatives.filter((_, idx) => idx !== i))
  }

  const updateAlt = (i: number, field: keyof Alternative, value: unknown) =>
    setAlternatives(alternatives.map((a, idx) => idx === i ? { ...a, [field]: value } : a))

  const save = async (quiet = false) => {
    setSaving(true)
    try {
      await api.put(`/api/decision/${id}/f3`, { alternatives: alternatives.map((a, i) => ({ ...a, sortOrder: i })) })
      await mutate(`/api/decision/${id}`)
      if (!quiet) toast.success('F3 salva')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Ficha F3 — Mapeamento de Alternativas</h3>
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">
            Regra de ouro: Apresente ao menos 3 alternativas, incluindo a opção de não agir.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {alternatives.map((alt, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                value={alt.label}
                onChange={(e) => updateAlt(i, 'label', e.target.value)}
                className="font-semibold text-sm px-2 py-1 border border-gray-200 rounded w-40 focus:ring-2 focus:ring-teal focus:outline-none"
                placeholder="Nome da opção"
                disabled={alt.label === 'Não agir (status quo)'}
              />
              <div className="flex-1" />
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="radio" name="recommended" checked={alt.isRecommended}
                  onChange={() => setAlternatives(alternatives.map((a, idx) => ({ ...a, isRecommended: idx === i })))}
                  className="accent-teal" />
                Recomendada
              </label>
              {alt.label !== 'Não agir (status quo)' && (
                <button onClick={() => removeAlt(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <textarea value={alt.description} onChange={(e) => updateAlt(i, 'description', e.target.value)}
              rows={2} placeholder="Descrição da alternativa..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pontos Positivos (Prós)</label>
                <textarea value={alt.pros} onChange={(e) => updateAlt(i, 'pros', e.target.value)}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pontos Negativos (Contras)</label>
                <textarea value={alt.cons} onChange={(e) => updateAlt(i, 'cons', e.target.value)}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Risco</label>
                <select value={alt.risk} onChange={(e) => updateAlt(i, 'risk', e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:ring-2 focus:ring-teal">
                  {RISK_COST_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Custo</label>
                <select value={alt.cost} onChange={(e) => updateAlt(i, 'cost', e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:ring-2 focus:ring-teal">
                  {RISK_COST_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nota (1–5)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button"
                      onClick={() => updateAlt(i, 'note', n)}
                      className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${alt.note >= n ? 'bg-teal text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alternatives.length < 7 && (
        <button onClick={addAlt}
          className="flex items-center gap-2 text-sm text-teal hover:underline">
          <Plus size={14} /> Adicionar alternativa
        </button>
      )}

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button onClick={() => router.push(`/dashboard/decisao/${id}/f2`)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          ← Voltar
        </button>
        <button onClick={() => save()} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Salvar
        </button>
        <button onClick={async () => { await save(true); router.push(`/dashboard/decisao/${id}/f4`) }}
          disabled={saving || alternatives.filter((a) => a.label !== 'Não agir (status quo)').length < 2}
          className="ml-auto bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
          Próxima etapa →
        </button>
      </div>
    </div>
  )
}
