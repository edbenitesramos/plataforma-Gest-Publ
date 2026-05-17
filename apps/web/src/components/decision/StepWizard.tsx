'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'f1', label: 'F1 — Problema' },
  { key: 'f2', label: 'F2 — Dados' },
  { key: 'f3', label: 'F3 — Alternativas' },
  { key: 'f4', label: 'F4 — Votação' },
  { key: 'f5', label: 'F5 — Registro' },
  { key: 'f6', label: 'F6 — Revisão' },
]

interface StepWizardProps {
  caseId: string
  completedSteps?: string[]
}

export function StepWizard({ caseId, completedSteps = [] }: StepWizardProps) {
  const pathname = usePathname()
  const currentStep = pathname.split('/').pop() ?? 'f1'

  return (
    <nav aria-label="Progresso do caso" className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const isActive = currentStep === step.key
        const isDone = completedSteps.includes(step.key)
        return (
          <div key={step.key} className="flex items-center">
            <Link
              href={`/dashboard/decisao/${caseId}/${step.key}`}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                isActive ? 'bg-navy text-white shadow' :
                isDone ? 'bg-teal/10 text-teal hover:bg-teal/20' :
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                isActive ? 'bg-white text-navy' :
                isDone ? 'bg-teal text-white' :
                'bg-gray-200 text-gray-500',
              )}>
                {i + 1}
              </span>
              <span className="hidden sm:inline">{step.label.split('—')[1]?.trim()}</span>
              <span className="sm:hidden">{step.key.toUpperCase()}</span>
            </Link>
            {i < STEPS.length - 1 && (
              <div className={cn('w-6 h-0.5 mx-1', isDone ? 'bg-teal' : 'bg-gray-200')} />
            )}
          </div>
        )
      })}
    </nav>
  )
}
