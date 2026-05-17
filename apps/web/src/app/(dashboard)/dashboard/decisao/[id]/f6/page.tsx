'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import toast from 'react-hot-toast'
import { Loader2, Star } from 'lucide-react'
import { api } from '@/lib/api'

const fetcher = (url: string) => api.get(url)

const REVIEW_QUESTIONS = [
  'A decisão foi implementada conforme planejado?',
  'Os objetivos foram alcançados?',
  'Os stakeholders foram adequadamente comunicados?',
  'O prazo foi cumprido?',
  'O orçamento foi respeitado?',
]

export default function F6Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: caseData } = useSWR(`/api/decision/${id}`, fetcher)
  const f6 = (caseData as {
    f6Review?: {
      reviewDate?: string; participants?: string; f5Reference?: string;
      reviewAnswers?: { question: string; answer: string; observation: string }[];
      goalAchieved?: string; satisfactionLevel?: number; advisorAdequate?: string;
      whatWorked?: string; whatToImprove?: string; futureRecs?: string;
      archivedAt?: string; reviewerSignature?: string;
    }
  } | undefined)?.f6Review

  const [reviewDate, setReviewDate] = useState('')
  const [participants, setParticipants] = useState('')
  const [f5Ref, setF5Ref] = useState('')
  const [answers, setAnswers] = useState(REVIEW_QUESTIONS.map((q) => ({ question: q, answer: '', observation: '' })))
  const [goalAchieved, setGoalAchieved] = useState('')
  const [satisfaction, setSatisfaction] = useState(0)
  const [advisorAdequate, setAdvisorAdequate] = useState('')
  const [whatWorked, setWhatWorked] = useState('')
  const [whatToImprove, setWhatToImprove] = useState('')
  const [futureRecs, setFutureRecs] = useState('')
  const [archivedAt, setArchivedAt] = useState('')
  const [reviewerSig, setReviewerSig] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (f6) {
      setReviewDate(f6.reviewDate ? String(f6.reviewDate).slice(0, 10) : '')
      setParticipants(f6.participants ?? '')
      setF5Ref(f6.f5Reference ?? '')
      if (f6.reviewAnswers?.length) setAnswers(f6.reviewAnswers as typeof answers)
      setGoalAchieved(f6.goalAchieved ?? '')
      setSatisfaction(f6.satisfactionLevel ?? 0)
      setAdvisorAdequate(f6.advisorAdequate ?? '')
      setWhatWorked(f6.whatWorked ?? '')
      setWhatToImprove(f6.whatToImprove ?? '')
      setFutureRecs(f6.futureRecs ?? '')
      setArchivedAt(f6.archivedAt ?? '')
      setReviewerSig(f6.reviewerSignature ?? '')
    }
  }, [f6])

  const updateAnswer = (i: number, field: 'answer' | 'observation', value: string) =>
    setAnswers(answers.map((a, idx) => idx === i ? { ...a, [field]: value } : a))

  const save = async (quiet = false) => {
    setSaving(true)
    try {
      await api.put(`/api/decision/${id}/f6`, {
        reviewDate, participants, f5Reference: f5Ref, reviewAnswers: answers,
        goalAchieved, satisfactionLevel: satisfaction, advisorAdequate,
        whatWorked, whatToImprove, futureRecs, archivedAt, reviewerSignature: reviewerSig,
      })
      await mutate(`/api/decision/${id}`)
      if (!quiet) toast.success('F6 salva — caso encerrado!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Ficha F6 — Revisão e Lições Aprendidas</h3>
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">
            Esta ficha é preenchida APÓS a implementação da decisão.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data da revisão</label>
          <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Referência F5</label>
          <input value={f5Ref} onChange={(e) => setF5Ref(e.target.value)} placeholder="Ex: DEC-2026-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Participantes</label>
          <input value={participants} onChange={(e) => setParticipants(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        </div>
      </div>

      {/* Review questions */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">Avaliação dos resultados</h4>
        <div className="space-y-4">
          {answers.map((a, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">{a.question}</p>
              <div className="flex gap-4 flex-wrap">
                {['Sim', 'Não', 'Parcial'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={`q${i}`} value={opt} checked={a.answer === opt}
                      onChange={() => updateAnswer(i, 'answer', opt)} className="accent-teal" />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
              <textarea value={a.observation} onChange={(e) => updateAnswer(i, 'observation', e.target.value)}
                rows={2} placeholder="Observação / Lição aprendida..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Quantitative assessment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">O objetivo foi atingido?</label>
          <select value={goalAchieved} onChange={(e) => setGoalAchieved(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal">
            <option value="">Selecionar...</option>
            <option>Totalmente</option>
            <option>Parcialmente</option>
            <option>Não atingido</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">O assessoramento foi adequado?</label>
          <select value={advisorAdequate} onChange={(e) => setAdvisorAdequate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal">
            <option value="">Selecionar...</option>
            <option>Sim</option>
            <option>Parcialmente</option>
            <option>Não</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Grau de satisfação</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setSatisfaction(n)}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${satisfaction >= n ? 'text-yellow-400' : 'text-gray-200'}`}>
              <Star size={28} fill={satisfaction >= n ? 'currentColor' : 'none'} />
            </button>
          ))}
          {satisfaction > 0 && <span className="ml-2 text-sm text-gray-500 self-center">{satisfaction}/5</span>}
        </div>
      </div>

      {/* Lessons learned */}
      {[
        { val: whatWorked, set: setWhatWorked, label: 'O que funcionou bem?' },
        { val: whatToImprove, set: setWhatToImprove, label: 'O que deve ser melhorado?' },
        { val: futureRecs, set: setFutureRecs, label: 'Recomendações para decisões futuras' },
      ].map(({ val, set, label }) => (
        <div key={label}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <textarea value={val} onChange={(e) => set(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
        </div>
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arquivado em</label>
          <input value={archivedAt} onChange={(e) => setArchivedAt(e.target.value)} placeholder="Ex: Arquivo digital / Pasta 2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assinatura do responsável</label>
          <input value={reviewerSig} onChange={(e) => setReviewerSig(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button onClick={() => router.push(`/dashboard/decisao/${id}/f5`)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          ← Voltar
        </button>
        <button onClick={() => save()} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Salvar
        </button>
        <button onClick={async () => { await save(true); toast.success('Caso encerrado!'); router.push(`/dashboard/decisao`) }}
          disabled={saving}
          className="ml-auto bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          Finalizar caso
        </button>
      </div>
    </div>
  )
}
