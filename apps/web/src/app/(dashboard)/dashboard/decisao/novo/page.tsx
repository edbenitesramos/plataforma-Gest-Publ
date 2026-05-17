'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const schema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  institution: z.string().optional(),
  sector: z.string().optional(),
  classification: z.enum(['STRATEGIC', 'OPERATIONAL', 'TACTICAL']).default('OPERATIONAL'),
})

type FormData = z.infer<typeof schema>

export default function NovoCasoPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const created = await api.post<{ id: string }>('/api/decision', data)
      toast.success('Caso criado!')
      router.push(`/dashboard/decisao/${created.id}/f1`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar caso')
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Novo Caso de Decisão</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título do caso *</label>
          <input
            {...register('title')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            placeholder="Ex: Contratação de sistema ERP"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instituição</label>
          <input
            {...register('institution')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            placeholder="Ex: Prefeitura Municipal de..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Setor / Área</label>
          <input
            {...register('sector')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            placeholder="Ex: TI, Saúde, Educação"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Classificação</label>
          <select
            {...register('classification')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
          >
            <option value="STRATEGIC">Estratégica</option>
            <option value="OPERATIONAL">Operacional</option>
            <option value="TACTICAL">Tática</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Criar e iniciar
          </button>
        </div>
      </form>
    </div>
  )
}
