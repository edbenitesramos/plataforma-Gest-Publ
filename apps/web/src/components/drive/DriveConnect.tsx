'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function DriveConnect() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api
      .get<{ connected: boolean }>('/api/drive/status')
      .then((res) => setConnected(res.connected))
      .catch(() => setConnected(false))
  }, [])

  const handleConnect = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ url: string }>('/api/drive/auth-url')
      window.location.href = res.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao conectar Drive')
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await api.delete('/api/drive/disconnect')
      setConnected(false)
      toast.success('Google Drive desconectado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desconectar Drive')
    } finally {
      setLoading(false)
    }
  }

  if (connected === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Verificando conexão...
      </div>
    )
  }

  if (connected) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Google Drive icon (simplified) */}
          <svg viewBox="0 0 87.3 78" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
          </svg>
          <span className="text-sm font-medium text-green-700">Drive conectado ✓</span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Desconectando...' : 'Desconectar'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
    >
      {/* Google Drive icon */}
      <svg viewBox="0 0 87.3 78" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#ffffff" />
        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#ffffff" />
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ffffff" />
        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#ffffff" />
        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#ffffff" />
        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffffff" />
      </svg>
      {loading ? 'Redirecionando...' : 'Conectar Google Drive'}
    </button>
  )
}
