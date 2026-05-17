'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import toast from 'react-hot-toast'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const fetcher = (url: string) => api.get(url)

const W5H2_FIELDS = [
  { key: 'what', label: 'O quê?', description: 'O que será feito?' },
  { key: 'why', label: 'Por quê?', description: 'Por que foi decidido?' },
  { key: 'who', label: 'Quem?', description: 'Quem será responsável?' },
  { key: 'when', label: 'Quando?', description: 'Quando será implementado?' },
  { key: 'where', label: 'Onde?', description: 'Onde será realizado?' },
  { key: 'how', label: 'Como?', description: 'Como será feito?' },
  { key: 'howMuch', label: 'Quanto custa?', description: 'Qual o custo estimado?' },
]

const COMM_CHANNELS = ['Ata de reunião', 'E-mail formal', 'Ordem do dia', 'Boletim', 'Reunião', 'Outro']

interface Stakeholder { id: string; name: string; role: string; signature: string }

export default function F5Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: caseData } = useSWR(`/api/decision/${id}`, fetcher)
  const f5 = (caseData as { f5Register?: { reference?: string; decisionSummary?: string; implementedAlternative?: string; implementationDeadline?: string; reviewDeadline?: string; communicationChannels?: string[]; w5h2?: Record<string, string>; stakeholders?: Stakeholder[] } } | undefined)?.f5Register

  const [reference, setReference] = useState('')
  const [summary, setSummary] = useState('')
  const [implAlt, setImplAlt] = useState('')
  const [implDeadline, setImplDeadline] = useState('')
  const [reviewDeadline, setReviewDeadline] = useState('')
  const [channels, setChannels] = useState<string[]>([])
  const [w5h2, setW5h2] = useState<Record<string, string>>({})
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (f5) {
      setReference(f5.reference ?? '')
      setSummary(f5.decisionSummary ?? '')
      setImplAlt(f5.implementedAlternative ?? '')
      setImplDeadline(f5.implementationDeadline ?? '')
      setReviewDeadline(f5.reviewDeadline ?? '')
      setChannels(f5.communicationChannels ?? [])
      setW5h2(f5.w5h2 ?? {})
      setStakeholders(f5.stakeholders ?? [])
    }
  }, [f5])

  const toggleChannel = (ch: string) =>
    setChannels(channels.includes(ch) ? channels.filter((c) => c !== ch) : [...channels, ch])

  const addStakeholder = () =>
    setStakeholders([...stakeholders, { id: crypto.randomUUID(), name: '', role: '', signature: '' }])
  const removeStakeholder = (i: number) =>
    setStakeholders(stakeholders.filter((_, idx) => idx !== i))
  const updateStakeholder = (i: number, field: keyof Stakeholder, value: string) =>
    setStakeholders(stakeholders.map((s, idx) => idx === i ? { ...s, [field]: value } : s))

  const save = async (quiet = false) => {
    setSaving(true)
    try {
      await api.put(`/api/decision/${id}/f5`, {
        reference, decisionSummary: summary, implementedAlternative: implAlt,
        implementationDeadline: implDeadline, reviewDeadline, communicationChannels: channels,
        w5h2, stakeholders,
      })
      await mutate(`/api/decision/${id}`)
      if (!quiet) toast.success('F5 salva')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Ficha F5 — Registro e Plano de Ação</h3>
        <p className="text-sm text-gray-500 mt-1">Documente formalmente a decisão e planeje a implementação.</p>
      </div>

      {/* Registro formal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { val: reference, set: setReference, label: 'Número/Referência', placeholder: 'Ex: DEC-2026-001' },
          { val: implAlt, set: setImplAlt, label: 'Alternativa implementada', placeholder: 'Ex: Opção A' },
          { val: implDeadline, set: setImplDeadline, label: 'Prazo de implementação', placeholder: 'dd/mm/aaaa' },
          { val: reviewDeadline, set: setReviewDeadline, label: 'Prazo de revisão (F6)', placeholder: 'dd/mm/aaaa' },
        ].map(({ val, set, label, placeholder }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Resumo da decisão tomada</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
      </div>

      {/* Canais de comunicação */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Canais de comunicação utilizados</label>
        <div className="flex flex-wrap gap-3">
          {COMM_CHANNELS.map((ch) => (
            <label key={ch} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={channels.includes(ch)} onChange={() => toggleChannel(ch)}
                className="w-4 h-4 accent-teal" />
              <span className="text-sm text-gray-700">{ch}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 5W2H */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">Plano de ação — Método 5W2H</h4>
        <div className="space-y-3">
          {W5H2_FIELDS.map(({ key, label, description }) => (
            <div key={key} className="flex gap-3 items-start">
              <div className="w-28 shrink-0">
                <p className="text-sm font-semibold text-navy">{label}</p>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
              <textarea value={w5h2[key] ?? ''} onChange={(e) => setW5h2({ ...w5h2, [key]: e.target.value })}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Stakeholders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-800">Responsáveis e signatários</h4>
          <button onClick={addStakeholder} className="flex items-center gap-1 text-sm text-teal hover:underline">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {stakeholders.map((s, i) => (
            <div key={s.id} className="flex gap-2 items-center">
              <input value={s.name} onChange={(e) => updateStakeholder(i, 'name', e.target.value)}
                placeholder="Nome / Área" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input value={s.role} onChange={(e) => updateStakeholder(i, 'role', e.target.value)}
                placeholder="Papel" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input value={s.signature} onChange={(e) => updateStakeholder(i, 'signature', e.target.value)}
                placeholder="Assinatura / Ciência" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <button onClick={() => removeStakeholder(i)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button onClick={() => router.push(`/dashboard/decisao/${id}/f4`)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          ← Voltar
        </button>
        <button onClick={() => save()} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Salvar
        </button>
        <button onClick={async () => { await save(true); router.push(`/dashboard/decisao/${id}/f6`) }}
          disabled={saving}
          className="ml-auto bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
          Próxima etapa →
        </button>
      </div>
    </div>
  )
}
