'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const fetcher = (url: string) => api.get(url)

export default function ConfiguracoesPage() {
  const user = useAuthStore((s) => s.user)

  const apiStatuses = [
    { name: 'PNCP', url: 'pncp.gov.br', status: 'ok' },
    { name: 'Portal da Transparência', url: 'portaldatransparencia.gov.br', status: 'warning' },
    { name: 'IBGE', url: 'servicodados.ibge.gov.br', status: 'ok' },
    { name: 'Câmara dos Deputados', url: 'dadosabertos.camara.leg.br', status: 'ok' },
    { name: 'Senado Federal', url: 'legis.senado.leg.br', status: 'ok' },
  ]

  const statusColors: Record<string, string> = {
    ok: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  const planLabels: Record<string, string> = {
    FREE: 'Gratuito',
    STARTER: 'Starter — R$ 99/mês',
    PROFESSIONAL: 'Professional — R$ 299/mês',
    ENTERPRISE: 'Enterprise',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Perfil</h3>
        <div className="space-y-3">
          {[
            { label: 'Nome', value: user?.name },
            { label: 'E-mail', value: user?.email },
            { label: 'Organização', value: user?.organization ?? '—' },
            { label: 'Função', value: user?.role },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">{label}</span>
              <span className="text-sm text-gray-900 font-medium">{value}</span>
            </div>
          ))}
        </div>
        <button className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          Editar perfil
        </button>
      </div>

      {/* Plan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Plano atual</h3>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-navy text-white text-sm rounded-full font-medium">
            {planLabels[user?.plan ?? 'FREE']}
          </span>
        </div>
        <div className="mt-4 text-sm text-gray-500 space-y-1">
          {user?.plan === 'FREE' && (
            <>
              <p>• Dashboard básico</p>
              <p>• Até 3 casos de decisão (SAD)</p>
              <p>• Até 2 alertas de licitação</p>
              <p className="text-teal font-medium cursor-pointer hover:underline mt-2">↑ Fazer upgrade do plano</p>
            </>
          )}
        </div>
      </div>

      {/* API status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Status das APIs públicas</h3>
        <div className="space-y-3">
          {apiStatuses.map(({ name, url, status }) => (
            <div key={name} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{name}</p>
                <p className="text-xs text-gray-400">{url}</p>
              </div>
              <span className={`text-xs font-medium ${status === 'ok' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                {status === 'ok' ? 'Online' : status === 'warning' ? 'Requer chave API' : 'Offline'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            Para usar o Portal da Transparência (CGU), configure a variável <code>CGU_API_KEY</code> no arquivo <code>.env</code>.
            Chave gratuita em: portaldatransparencia.gov.br/api-de-dados/cadastrar
          </p>
        </div>
      </div>
    </div>
  )
}
