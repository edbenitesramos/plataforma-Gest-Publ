'use client'

import useSWR from 'swr'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { FileText, Bell, Scale, TrendingUp, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

const fetcher = (url: string) => api.get(url)

function KpiCard({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
}

const COLORS = ['#0EA5E9', '#1B2A4A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

const mockMonthlyData = Array.from({ length: 12 }, (_, i) => ({
  mes: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
  licitacoes: Math.floor(Math.random() * 200) + 50,
}))

const mockModalidades = [
  { name: 'Pregão Eletrônico', value: 54 },
  { name: 'Concorrência', value: 18 },
  { name: 'Dispensa', value: 15 },
  { name: 'Pregão Presencial', value: 8 },
  { name: 'Outros', value: 5 },
]

const mockGastosOrgao = [
  { orgao: 'Min. Saúde', valor: 92000 },
  { orgao: 'Min. Educação', valor: 45000 },
  { orgao: 'Min. Defesa', valor: 38000 },
  { orgao: 'Min. Infraestrutura', valor: 31000 },
  { orgao: 'Min. Cidadania', valor: 28000 },
]

export default function DashboardPage() {
  const { data: alerts } = useSWR('/api/licitacoes/alertas', fetcher)
  const { data: cases } = useSWR('/api/decision?limit=3', fetcher)

  const alertList = (alerts as { id: string; name: string; isActive?: boolean; matches?: { id: string; entity?: string; title: string; value?: number; state?: string; publishedAt?: string }[] }[] | undefined) ?? []
  const caseList = (cases as { cases?: { id: string; title: string; status: string; updatedAt: string }[] } | undefined)?.cases ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Visão geral — dados públicos em tempo real</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Licitações hoje"
          value="--"
          subtitle="API: PNCP"
          icon={FileText}
          color="bg-teal"
        />
        <KpiCard
          title="Alertas ativos"
          value={alertList.filter((a) => a.isActive !== false).length}
          subtitle="Monitoramento PNCP"
          icon={Bell}
          color="bg-navy"
        />
        <KpiCard
          title="Casos SAD abertos"
          value={caseList.filter((c) => !['CLOSED'].includes(c.status)).length}
          subtitle="Apoio à decisão"
          icon={Scale}
          color="bg-purple-600"
        />
        <KpiCard
          title="Contratos > R$1M"
          value="--"
          subtitle="API: CGU"
          icon={TrendingUp}
          color="bg-green-600"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Licitações por mês (últimos 12 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="licitacoes" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Distribuição por modalidade (PNCP)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mockModalidades} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} fontSize={11}>
                {mockModalidades.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Gastos federais por órgão (R$ bilhões)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockGastosOrgao} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="orgao" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}bi`} />
              <Bar dataKey="valor" fill="#1B2A4A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1">Mapa: Licitações por estado</h3>
          <p className="text-xs text-gray-400 mb-3">Integração Leaflet + IBGE (em desenvolvimento)</p>
          <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 border-dashed">
            <p className="text-sm text-gray-400">Mapa interativo disponível com Leaflet.js</p>
          </div>
        </div>
      </div>

      {/* Recent alert matches table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Últimas licitações detectadas pelos meus alertas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Órgão</th>
                <th className="text-left">Título</th>
                <th className="text-right">Valor</th>
                <th className="text-center">Estado</th>
                <th className="text-left">Data</th>
                <th className="text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {alertList.flatMap((a) =>
                (a.matches ?? []).map((m) => (
                  <tr key={m.id}>
                    <td>{m.entity ?? '—'}</td>
                    <td className="max-w-xs truncate">{m.title}</td>
                    <td className="text-right">{m.value ? formatCurrency(m.value) : '—'}</td>
                    <td className="text-center">{m.state ?? '—'}</td>
                    <td>{m.publishedAt ? formatDate(m.publishedAt) : '—'}</td>
                    <td className="text-center">
                      <button className="text-xs text-teal hover:underline">Ver</button>
                    </td>
                  </tr>
                ))
              )}
              {alertList.every((a) => !a.matches?.length) && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    Nenhum resultado ainda. Configure alertas na seção LicitaAlerta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
