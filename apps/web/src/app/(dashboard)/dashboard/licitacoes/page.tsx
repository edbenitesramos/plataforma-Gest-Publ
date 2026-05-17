'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Bell, Plus, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const fetcher = (url: string) => api.get(url)

interface SearchResult {
  numeroControlePNCP?: string
  razaoSocialOrgao?: string
  objetoCompra?: string
  valorTotalEstimado?: number
  uf?: string
  dataPublicacaoPncp?: string
  modalidadeNome?: string
}

interface Alert {
  id: string
  name: string
  keywords: string[]
  states: string[]
  isActive: boolean
  matches?: { id: string; title: string; value?: number; state?: string; publishedAt?: string }[]
}

export default function LicitacoesPage() {
  const [search, setSearch] = useState('')
  const [uf, setUf] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showNewAlert, setShowNewAlert] = useState(false)
  const [alertName, setAlertName] = useState('')
  const [alertKeywords, setAlertKeywords] = useState('')
  const [alertStates, setAlertStates] = useState('')
  const [savingAlert, setSavingAlert] = useState(false)

  const { data: alertsData, mutate: mutateAlerts } = useSWR('/api/licitacoes/alertas', fetcher)
  const alerts: Alert[] = (alertsData as Alert[] | undefined) ?? []

  const handleSearch = async () => {
    setSearching(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (uf) params.set('uf', uf)
      const data = await api.get<{ data: SearchResult[] }>(`/api/licitacoes/buscar?${params}`)
      setResults((data as { data?: SearchResult[] }).data ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na busca')
    } finally {
      setSearching(false)
    }
  }

  const handleCreateAlert = async () => {
    if (!alertName.trim()) return toast.error('Nome do alerta obrigatório')
    setSavingAlert(true)
    try {
      await api.post('/api/licitacoes/alertas', {
        name: alertName,
        keywords: alertKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        states: alertStates.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
      })
      toast.success('Alerta criado!')
      setShowNewAlert(false)
      setAlertName('')
      setAlertKeywords('')
      setAlertStates('')
      mutateAlerts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSavingAlert(false)
    }
  }

  const handleDeleteAlert = async (id: string) => {
    try {
      await api.delete(`/api/licitacoes/alertas/${id}`)
      toast.success('Alerta removido')
      mutateAlerts()
    } catch {
      toast.error('Erro ao remover')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">LicitaAlerta</h2>
          <p className="text-gray-500 text-sm mt-1">Busca e monitoramento de licitações — PNCP</p>
        </div>
        <button onClick={() => setShowNewAlert(!showNewAlert)}
          className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy/90">
          <Bell size={16} /> Novo Alerta
        </button>
      </div>

      {/* New alert form */}
      {showNewAlert && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">Configurar novo alerta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do alerta *</label>
              <input value={alertName} onChange={(e) => setAlertName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:outline-none"
                placeholder="Ex: Software SC" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave (separadas por vírgula)</label>
              <input value={alertKeywords} onChange={(e) => setAlertKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:outline-none"
                placeholder="software, sistema, TI" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estados (UF, separados por vírgula)</label>
              <input value={alertStates} onChange={(e) => setAlertStates(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:outline-none"
                placeholder="SC, PR, RS" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNewAlert(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleCreateAlert} disabled={savingAlert}
              className="flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90 disabled:opacity-50">
              {savingAlert ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Criar alerta
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Buscar licitações</h3>
        <div className="flex gap-3 flex-wrap">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:outline-none"
            placeholder="Buscar por objeto, órgão..." />
          <select value={uf} onChange={(e) => setUf(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal">
            <option value="">Todos os estados</option>
            {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={handleSearch} disabled={searching}
            className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Buscar
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Órgão</th>
                  <th className="text-left">Objeto</th>
                  <th className="text-right">Valor estimado</th>
                  <th className="text-center">UF</th>
                  <th className="text-left">Data</th>
                  <th className="text-left">Modalidade</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.numeroControlePNCP ?? i}>
                    <td className="max-w-xs truncate">{r.razaoSocialOrgao ?? '—'}</td>
                    <td className="max-w-sm truncate">{r.objetoCompra ?? '—'}</td>
                    <td className="text-right">{r.valorTotalEstimado ? formatCurrency(r.valorTotalEstimado) : '—'}</td>
                    <td className="text-center">{r.uf ?? '—'}</td>
                    <td>{r.dataPublicacaoPncp ? formatDate(r.dataPublicacaoPncp) : '—'}</td>
                    <td>{r.modalidadeNome ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {results.length === 0 && !searching && (
          <p className="mt-4 text-sm text-gray-400 text-center">Faça uma busca para ver resultados.</p>
        )}
      </div>

      {/* Alerts list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Meus alertas ({alerts.length})</h3>
        </div>
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Bell size={32} className="mx-auto mb-2 opacity-30" />
            <p>Nenhum alerta configurado.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-4 p-4">
                <div className={`w-2.5 h-2.5 rounded-full ${alert.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{alert.name}</p>
                  <p className="text-xs text-gray-400">
                    {alert.keywords.join(', ')} {alert.states.length ? `· ${alert.states.join(', ')}` : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{alert.matches?.length ?? 0} resultados</span>
                <button onClick={() => handleDeleteAlert(alert.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
