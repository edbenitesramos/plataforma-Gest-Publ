'use client'

import { use, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import useSWR, { mutate } from 'swr'
import toast from 'react-hot-toast'
import { Loader2, Save } from 'lucide-react'
import { api } from '@/lib/api'

const fetcher = (url: string) => api.get(url)

const DECISION_TYPES = [
  'Rotineira (programada)',
  'Não rotineira',
  'Urgente',
  'Estratégica',
]

const EFFORT_LEVELS = [
  { value: 'Baixo', label: 'Baixo (< 1h)' },
  { value: 'Médio', label: 'Médio (1–4h)' },
  { value: 'Alto', label: 'Alto (> 4h — reunir equipe)' },
]

interface F1FormData {
  decisionDate: string
  deadline: string
  decider: string
  advisor: string
  decisionType: string[]
  whatDecision: string
  context: string
  errorImpact: string
  constraints: string
  effortLevel: string
}

export default function F1Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: caseData } = useSWR(`/api/decision/${id}`, fetcher)
  const f1 = (caseData as { f1Problem?: Partial<F1FormData> } | undefined)?.f1Problem

  const { register, handleSubmit, reset, watch, formState: { isSubmitting, isDirty } } = useForm<F1FormData>()
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (f1) {
      reset({
        decisionDate: f1.decisionDate ? String(f1.decisionDate).slice(0, 10) : '',
        deadline: f1.deadline ?? '',
        decider: f1.decider ?? '',
        advisor: f1.advisor ?? '',
        decisionType: f1.decisionType ?? [],
        whatDecision: f1.whatDecision ?? '',
        context: f1.context ?? '',
        errorImpact: f1.errorImpact ?? '',
        constraints: f1.constraints ?? '',
        effortLevel: f1.effortLevel ?? '',
      })
    }
  }, [f1, reset])

  const saveData = async (data: F1FormData, quiet = false) => {
    await api.put(`/api/decision/${id}/f1`, data)
    await mutate(`/api/decision/${id}`)
    if (!quiet) toast.success('F1 salva')
  }

  // Auto-save every 30s
  useEffect(() => {
    const subscription = watch(() => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        handleSubmit((data) => saveData(data, true))()
      }, 30000)
    })
    return () => {
      subscription.unsubscribe()
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [watch])

  const onSave = handleSubmit(async (data) => {
    try {
      await saveData(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  })

  const onNext = handleSubmit(async (data) => {
    try {
      if (!data.whatDecision) {
        toast.error('Preencha "Qual é a decisão" antes de avançar')
        return
      }
      await saveData(data)
      router.push(`/dashboard/decisao/${id}/f2`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Ficha F1 — Definição do Problema</h3>
        <p className="text-sm text-gray-500 mt-1">Identifique claramente a decisão que precisa ser tomada.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input type="date" {...register('decisionDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de decisão</label>
          <input {...register('deadline')} placeholder="Ex: 30/06/2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quem decide</label>
          <input {...register('decider')} placeholder="Nome / cargo"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quem assessora</label>
          <input {...register('advisor')} placeholder="Nome / cargo"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de decisão</label>
        <div className="flex flex-wrap gap-3">
          {DECISION_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" value={type} {...register('decisionType')}
                className="w-4 h-4 accent-teal" />
              <span className="text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {[
        { field: 'whatDecision' as const, label: 'Qual é a decisão a ser tomada? *', hint: 'Descreva em 1 ou 2 frases objetivas' },
        { field: 'context' as const, label: 'Qual é o contexto e o problema?', hint: 'Não confunda sintoma com causa' },
        { field: 'errorImpact' as const, label: 'Qual é o impacto se a decisão for errada ou atrasada?', hint: '' },
        { field: 'constraints' as const, label: 'Que restrições ou condicionantes devem ser respeitadas?', hint: '' },
      ].map(({ field, label, hint }) => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
          <textarea
            {...register(field)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            placeholder="Descreva aqui..."
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nível de esforço</label>
        <div className="flex flex-wrap gap-4">
          {EFFORT_LEVELS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={value} {...register('effortLevel')}
                className="w-4 h-4 accent-teal" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar rascunho
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="ml-auto flex items-center gap-2 bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Próxima etapa →
        </button>
      </div>
    </div>
  )
}
