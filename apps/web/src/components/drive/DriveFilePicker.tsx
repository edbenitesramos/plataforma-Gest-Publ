'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { api, apiFetch } from '@/lib/api'
import toast from 'react-hot-toast'
import { Paperclip, Upload, X, Search, FileText, Loader2 } from 'lucide-react'

interface DriveFileItem {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  iconLink?: string
  size?: string | number
}

interface Props {
  caseId: string
  onAttached?: () => void
}

function getMimeLabel(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'Planilha'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Apresentação'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'Documento'
  if (mimeType.includes('image')) return 'Imagem'
  if (mimeType.includes('folder')) return 'Pasta'
  return 'Arquivo'
}

export default function DriveFilePicker({ caseId, onAttached }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'browse' | 'upload'>('browse')
  const [files, setFiles] = useState<DriveFileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [attaching, setAttaching] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchFiles = useCallback(async (q?: string, pageToken?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (pageToken) params.set('pageToken', pageToken)
      const res = await api.get<{ files: DriveFileItem[]; nextPageToken: string | null }>(
        `/api/drive/files${params.toString() ? `?${params}` : ''}`,
      )
      setFiles(pageToken ? (prev) => [...prev, ...res.files] : res.files)
      setNextPageToken(res.nextPageToken)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao listar arquivos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && tab === 'browse') {
      fetchFiles(search || undefined)
    }
  }, [open, tab])

  const handleSearch = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchFiles(value || undefined)
    }, 400)
  }

  const handleAttach = async (fileId: string) => {
    setAttaching(fileId)
    try {
      await api.post('/api/drive/attach', { caseId, fileId })
      toast.success('Arquivo anexado com sucesso')
      onAttached?.()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao anexar arquivo')
    } finally {
      setAttaching(null)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('caseId', caseId)

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const API_URL = ''
      const res = await fetch(`${API_URL}/api/drive/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }

      toast.success('Arquivo enviado com sucesso')
      setUploadFile(null)
      onAttached?.()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Paperclip size={14} />
        Anexar arquivo do Drive
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Arquivos do Google Drive</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setTab('browse')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'browse'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Meus arquivos
              </button>
              <button
                onClick={() => setTab('upload')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'upload'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Enviar arquivo
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col p-6">
              {tab === 'browse' ? (
                <>
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Pesquisar arquivos..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* File list */}
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {loading && files.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 size={20} className="animate-spin mr-2" />
                        Carregando...
                      </div>
                    ) : files.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Nenhum arquivo encontrado
                      </div>
                    ) : (
                      files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {file.iconLink ? (
                            <img src={file.iconLink} alt="" className="w-5 h-5 flex-shrink-0" />
                          ) : (
                            <FileText size={18} className="text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{getMimeLabel(file.mimeType)}</p>
                          </div>
                          <button
                            onClick={() => handleAttach(file.id)}
                            disabled={attaching === file.id}
                            className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {attaching === file.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              'Anexar'
                            )}
                          </button>
                        </div>
                      ))
                    )}

                    {nextPageToken && (
                      <button
                        onClick={() => fetchFiles(search || undefined, nextPageToken)}
                        disabled={loading}
                        className="w-full py-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {loading ? 'Carregando...' : 'Carregar mais'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecionar arquivo
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {uploadFile && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Arquivo:</span> {uploadFile.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(uploadFile.size / 1024).toFixed(1)} KB • {uploadFile.type || 'tipo desconhecido'}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    O arquivo será enviado para a pasta &quot;Plataforma GovAnalytics&quot; no seu Google Drive e vinculado a este caso.
                  </p>

                  <button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        Enviar para Drive
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
