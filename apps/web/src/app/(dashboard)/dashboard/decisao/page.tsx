'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'

const fetcher = (url: string) => api.get(url)

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700' },
  DECIDED: { label: 'Decidido', color: 'bg-green-100 text-green-700' },
  IMPLEMENTING: { label: 'Implementando', color: 'bg-orange-100 text-orange-700' },
  REVIEWING: { label: 'Em revisão', color: 'bg-purple-100 text-purple-700' },
  CLOSED: { label: 'Encerrado', color: 'bg-gray-800 text-white' },
}

const CLASS_LABELS: Record<string, string> = {
  STRATEGIC: 'Estratégica',
  OPERATIONAL: 'Operacional',
  TACTICAL: 'Tática',
}

function CaseProgress({ c }: { c: Record<string, unknown> }) {
  const steps = ['f1Problem', 'f2DataCollection', 'f3Alternatives', 'f4Voting', 'f5Register', 'f6Review']
  const labels = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']
  const completed = steps.filter((s) => {
    const val = c[s]
    if (!val) return false
    if (Array.isArray(val)) return val.length > 0
    return true
  }).length

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const val = c[s]
        const done = val && (Array.isArray(val) ? (val as unknown[]).length > 0 : true)
        return (
          <div key={s} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-teal text-white' : 'bg-gray-100 text-gray-400'}`}>
              {labels[i]}
            </div>
            {i < 5 && <div className={`w-4 h-0.5 ${done ? 'bg-teal' : 'bg-gray-200'}`} />}
          </div>
        )
      })}
      <span className="ml-2 text-xs text-gray-500">{completed}/6</span>
    </div>
  )
}

export default function DecisaoPage() {
  const { data, isLoading } = useSWR('/api/decision', fetcher)
  const cases = (data as { cases?: Record<string, unknown>[] } | undefined)?.cases ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Apoio à Decisão</h2>
          <p className="text-gray-500 text-sm mt-1">Gestão de casos com fichas F1 a F6</p>
        </div>
        <Link
          href="/dashboard/decisao/novo"
          className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
        >
          <Plus size={16} />
          Novo Caso
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-4">Nenhum caso criado ainda.</p>
          <Link
            href="/dashboard/decisao/novo"
            className="inline-flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"
          >
            <Plus size={16} />
            Criar primeiro caso
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Título</th>
                <th className="text-left">Classificação</th>
                <th className="text-center">Status</th>
                <th className="text-left">Progresso</th>
                <th className="text-left">Atualizado</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const status = STATUS_LABELS[c.status as string] ?? STATUS_LABELS.DRAFT
                return (
                  <tr key={c.id as string}>
                    <td className="font-medium max-w-xs truncate">{c.title as string}</td>
                    <td>{CLASS_LABELS[c.classification as string] ?? c.classification as string}</td>
                    <td className="text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td><CaseProgress c={c} /></td>
                    <td>{formatDate(c.updatedAt as string)}</td>
                    <td className="text-center">
                      <Link
                        href={`/dashboard/decisao/${c.id}/f1`}
                        className="inline-flex items-center gap-1 text-sm text-teal hover:underline"
                      >
                        Abrir <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
