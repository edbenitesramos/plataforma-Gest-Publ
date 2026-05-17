'use client'

import { use } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { StepWizard } from '@/components/decision/StepWizard'

const fetcher = (url: string) => api.get(url)

export default function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data } = useSWR(`/api/decision/${id}`, fetcher)
  const decisionCase = data as { title?: string; f1Problem?: unknown; f2DataCollection?: unknown; f3Alternatives?: unknown[]; f4Voting?: unknown; f5Register?: unknown; f6Review?: unknown } | undefined

  const completedSteps: string[] = []
  if (decisionCase?.f1Problem) completedSteps.push('f1')
  if (decisionCase?.f2DataCollection) completedSteps.push('f2')
  if (decisionCase?.f3Alternatives && (decisionCase.f3Alternatives as unknown[]).length > 0) completedSteps.push('f3')
  if (decisionCase?.f4Voting) completedSteps.push('f4')
  if (decisionCase?.f5Register) completedSteps.push('f5')
  if (decisionCase?.f6Review) completedSteps.push('f6')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {decisionCase?.title ?? 'Carregando...'}
        </h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <StepWizard caseId={id} completedSteps={completedSteps} />
      </div>

      {children}
    </div>
  )
}
