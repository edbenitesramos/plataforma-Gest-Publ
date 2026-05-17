'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const fetcher = (url: string) => api.get(url)

interface Criterion { id: string; name: string; weight: number; scores: Record<string, number> }
interface Alternative { id?: string; label: string; sortOrder: number }

export default function F4Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: caseData } = useSWR(`/api/decision/${id}`, fetcher)
  const f4 = (caseData as { f4Voting?: { criteria?: Criterion[]; advisorRecommendation?: string; chosenAlternativeId?: string; divergedFromRec?: boolean; deciderJustification?: string; deciderSignature?: string } } | undefined)?.f4Voting
  const alts: Alternative[] = (caseData as { f3Alternatives?: Alternative[] } | undefined)?.f3Alternatives ?? []

  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', name: 'Custo', weight: 3, scores: {} },
    { id: '2', name: 'Prazo', weight: 2, scores: {} },
    { id: '3', name: 'Risco', weight: 4, scores: {} },
  ])
  const [advisorRec, setAdvisorRec] = useState('')
  const [chosenAlt, setChosenAlt] = useState('')
  const [diverged, setDiverged] = useState(false)
  const [justification, setJustification] = useState('')
  const [signature, setSignature] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (f4) {
      if (f4.criteria?.length) setCriteria(f4.criteria as Criterion[])
      setAdvisorRec(f4.advisorRecommendation ?? '')
      setChosenAlt(f4.chosenAlternativeId ?? '')
      setDiverged(f4.divergedFromRec ?? false)
      setJustification(f4.deciderJustification ?? '')
      setSignature(f4.deciderSignature ?? '')
    }
  }, [f4])

  const addCriterion = () => setCriteria([...criteria, { id: crypto.randomUUID(), name: '', weight: 1, scores: {} }])
  const removeCriterion = (i: number) => setCriteria(criteria.filter((_, idx) => idx !== i))
  const updateCriterion = (i: number, field: 'name' | 'weight', value: unknown) =>
    setCriteria(criteria.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  const setScore = (critId: string, altLabel: string, score: number) =>
    setCriteria(criteria.map((c) => c.id === critId ? { ...c, scores: { ...c.scores, [altLabel]: score } } : c))

  const totals = alts.map((alt) => ({
    name: alt.label,
    total: criteria.reduce((sum, c) => sum + (c.scores[alt.label] ?? 0) * c.weight, 0),
  }))

  const maxTotal = Math.max(...totals.map((t) => t.total), 1)

  const save = async (quiet = false) => {
    setSaving(true)
    try {
      await api.put(`/api/decision/${id}/f4`, {
        criteria,
        advisorRecommendation: advisorRec,
        chosenAlternativeId: chosenAlt,
        divergedFromRec: diverged,
        deciderJustification: justification,
        deciderSignature: signature,
        decidedAt: chosenAlt ? new Date().toISOString() : undefined,
      })
      await mutate(`/api/decision/${id}`)
      if (!quiet) toast.success('F4 salva')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Ficha F4 — Votação Ponderada e Seleção</h3>
        <p className="text-sm text-gray-500 mt-1">Avalie as alternativas por critério com peso de importância.</p>
      </div>

      {/* Voting table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-800">Tabela de votação ponderada</h4>
          <button onClick={addCriterion} className="flex items-center gap-1 text-sm text-teal hover:underline">
            <Plus size={14} /> Critério
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-navy text-white">
                <th className="text-left p-2 font-medium">Critério</th>
                <th className="text-center p-2 font-medium w-16">Peso</th>
                {alts.map((a) => (
                  <th key={a.label} className="text-center p-2 font-medium w-24">{a.label}</th>
                ))}
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c, i) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="p-2">
                    <input value={c.name} onChange={(e) => updateCriterion(i, 'name', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Ex: Custo" />
                  </td>
                  <td className="p-2">
                    <input type="number" min={1} max={5} value={c.weight}
                      onChange={(e) => updateCriterion(i, 'weight', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center" />
                  </td>
                  {alts.map((a) => (
                    <td key={a.label} className="p-2 text-center">
                      <input type="number" min={1} max={5} value={c.scores[a.label] ?? ''}
                        onChange={(e) => setScore(c.id, a.label, Number(e.target.value))}
                        className="w-full px-1 py-1 border border-gray-200 rounded text-sm text-center" />
                    </td>
                  ))}
                  <td className="p-2">
                    <button onClick={() => removeCriterion(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-navy bg-gray-50 font-semibold">
                <td className="p-2 text-sm">TOTAL PONDERADO</td>
                <td></td>
                {totals.map((t) => (
                  <td key={t.name} className="p-2 text-center">
                    <span className={`${t.total === maxTotal && t.total > 0 ? 'text-teal font-bold' : 'text-gray-700'}`}>
                      {t.total}
                      {t.total === maxTotal && t.total > 0 && <span className="ml-1">★</span>}
                    </span>
                  </td>
                ))}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      {totals.some((t) => t.total > 0) && (
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Visualização dos totais</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={totals}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommendation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Recomendação do assessor</label>
        <textarea value={advisorRec} onChange={(e) => setAdvisorRec(e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
          placeholder="Alternativa recomendada e justificativa..." />
      </div>

      {/* Decision */}
      <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h4 className="font-semibold text-gray-800">Decisão do responsável</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alternativa escolhida</label>
          <select value={chosenAlt} onChange={(e) => setChosenAlt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal">
            <option value="">Selecionar...</option>
            {alts.map((a) => <option key={a.label} value={a.label}>{a.label}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={diverged} onChange={(e) => setDiverged(e.target.checked)} className="w-4 h-4 accent-teal" />
          <span className="text-sm text-gray-700">Decisão diverge da recomendação do assessor</span>
        </label>
        {diverged && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa do decisor</label>
            <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assinatura digital</label>
          <input value={signature} onChange={(e) => setSignature(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            placeholder="Nome completo do decisor" />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button onClick={() => router.push(`/dashboard/decisao/${id}/f3`)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          ← Voltar
        </button>
        <button onClick={() => save()} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Salvar
        </button>
        <button onClick={async () => { await save(true); router.push(`/dashboard/decisao/${id}/f5`) }}
          disabled={saving}
          className="ml-auto bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
          Próxima etapa →
        </button>
      </div>
    </div>
  )
}
