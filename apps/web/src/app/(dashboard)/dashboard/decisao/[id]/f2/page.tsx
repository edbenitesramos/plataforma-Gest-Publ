'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import toast from 'react-hot-toast'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const fetcher = (url: string) => api.get(url)

interface Source { id: string; name: string; responsible: string; deadline: string; reliability: string }

const CHECKLIST_ITEMS = [
  { key: 'recent', label: 'Os dados são recentes o suficiente?' },
  { key: 'reliable', label: 'A fonte é confiável e auditável?' },
  { key: 'relevant', label: 'Os dados estão relacionados ao problema?' },
  { key: 'bias', label: 'Existe risco de viés?' },
  { key: 'complete', label: 'Alguma informação crítica ainda está faltando?' },
]

export default function F2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: caseData } = useSWR(`/api/decision/${id}`, fetcher)
  const f2 = (caseData as { f2DataCollection?: { sources?: Source[]; checklist?: Record<string, boolean>; gaps?: string; synthesis?: string } } | undefined)?.f2DataCollection

  const [sources, setSources] = useState<Source[]>([])
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [gaps, setGaps] = useState('')
  const [synthesis, setSynthesis] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (f2) {
      setSources(f2.sources ?? [])
      setChecklist(f2.checklist ?? {})
      setGaps(f2.gaps ?? '')
      setSynthesis(f2.synthesis ?? '')
    }
  }, [f2])

  const addSource = () => setSources([...sources, { id: crypto.randomUUID(), name: '', responsible: '', deadline: '', reliability: 'Alta' }])
  const removeSource = (i: number) => setSources(sources.filter((_, idx) => idx !== i))
  const updateSource = (i: number, field: keyof Source, value: string) => {
    setSources(sources.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const save = async (quiet = false) => {
    setSaving(true)
    try {
      await api.put(`/api/decision/${id}/f2`, { sources, checklist, gaps, synthesis })
      await mutate(`/api/decision/${id}`)
      if (!quiet) toast.success('F2 salva')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Ficha F2 — Coleta de Dados</h3>
        <p className="text-sm text-gray-500 mt-1">Identifique e qualifique as fontes de informação.</p>
      </div>

      {/* Sources table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-800">Fontes de dados</h4>
          <button onClick={addSource} className="flex items-center gap-1 text-sm text-teal hover:underline">
            <Plus size={14} /> Adicionar fonte
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 text-gray-600 font-medium">Fonte / Documento</th>
                <th className="text-left p-2 text-gray-600 font-medium">Responsável</th>
                <th className="text-left p-2 text-gray-600 font-medium">Prazo</th>
                <th className="text-left p-2 text-gray-600 font-medium">Confiabilidade</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s, i) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="p-2"><input value={s.name} onChange={(e) => updateSource(i, 'name', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Nome da fonte" /></td>
                  <td className="p-2"><input value={s.responsible} onChange={(e) => updateSource(i, 'responsible', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                  <td className="p-2"><input value={s.deadline} onChange={(e) => updateSource(i, 'deadline', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm" placeholder="dd/mm/aaaa" /></td>
                  <td className="p-2">
                    <select value={s.reliability} onChange={(e) => updateSource(i, 'reliability', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm bg-white">
                      <option>Alta</option>
                      <option>Média</option>
                      <option>Baixa</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button onClick={() => removeSource(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-400 text-sm">Nenhuma fonte adicionada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">Checklist de qualificação dos dados</h4>
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={checklist[key] ?? false}
                onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                className="w-4 h-4 accent-teal" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Gaps and synthesis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">O que falta?</label>
          <textarea value={gaps} onChange={(e) => setGaps(e.target.value)} rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            placeholder="Lacunas de informação identificadas..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Síntese das informações coletadas</label>
          <textarea value={synthesis} onChange={(e) => setSynthesis(e.target.value)} rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            placeholder="Resumo dos dados coletados..." />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button onClick={() => router.push(`/dashboard/decisao/${id}/f1`)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          ← Voltar
        </button>
        <button onClick={() => save()} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Salvar
        </button>
        <button onClick={async () => { await save(true); router.push(`/dashboard/decisao/${id}/f3`) }}
          disabled={saving}
          className="ml-auto bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
          Próxima etapa →
        </button>
      </div>
    </div>
  )
}
