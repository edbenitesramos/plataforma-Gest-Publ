'use client'

import useSWR from 'swr'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'

const fetcher = (url: string) => api.get(url)

export default function TransparenciaPage() {
  const { data, isLoading } = useSWR('/api/transparencia/gastos', fetcher)
  const gastos = (data as { data?: { orgao: string; valor: number }[] } | undefined)?.data
    ?? (data as { orgao: string; valor: number }[] | undefined)
    ?? []

  const chartData = gastos.slice(0, 10).map((g: { orgao: string; valor: number }) => ({
    orgao: g.orgao,
    valor: Math.round(g.valor / 1e9),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">TransparênciaPro</h2>
        <p className="text-gray-500 text-sm mt-1">Dados do Portal da Transparência — CGU</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Gastos federais por órgão (R$ bilhões)</h3>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="orgao" type="category" width={180} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `R$ ${v}bi`} />
              <Bar dataKey="valor" fill="#1B2A4A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Contratos', 'Convênios', 'Transferências'].map((item) => (
          <div key={item} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="font-medium text-gray-700 mb-2">{item}</h4>
            <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">Em desenvolvimento</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
