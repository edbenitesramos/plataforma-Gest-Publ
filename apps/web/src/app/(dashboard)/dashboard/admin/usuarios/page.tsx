'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { UserPlus, Users, Mail, ToggleLeft, ToggleRight, Loader2, X } from 'lucide-react'
import { api } from '@/lib/api'

const inviteSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['ANALYST', 'VIEWER', 'ADMIN']),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
})

type InviteData = z.infer<typeof inviteSchema>

interface User {
  id: string
  name: string
  email: string
  role: string
  plan: string
  isActive: boolean
  emailVerified: boolean
  organization: string | null
  createdAt: string
}

interface Invite {
  id: string
  name: string
  email: string
  role: string
  plan: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
  createdBy: { name: string }
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  ANALYST: 'Analista',
  VIEWER: 'Visualizador',
}

const planLabels: Record<string, string> = {
  FREE: 'Gratuito',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'ANALYST', plan: 'FREE' },
  })

  const load = async () => {
    try {
      const [usersRes, invitesRes] = await Promise.all([
        api.get<User[]>('/api/admin/users'),
        api.get<Invite[]>('/api/admin/invites'),
      ])
      setUsers(usersRes)
      setInvites(invitesRes)
    } catch {
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (userId: string) => {
    setTogglingId(userId)
    try {
      await api.patch(`/api/admin/users/${userId}/toggle`, {})
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u))
    } catch {
      toast.error('Erro ao alterar status.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleInvite = async (data: InviteData) => {
    try {
      await api.post('/api/admin/invite', data)
      toast.success(`Convite enviado para ${data.email}`)
      reset()
      setShowModal(false)
      load()
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao enviar convite.')
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await api.delete(`/api/admin/invites/${inviteId}`)
      setInvites(prev => prev.filter(i => i.id !== inviteId))
      toast.success('Convite cancelado.')
    } catch {
      toast.error('Erro ao cancelar convite.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    )
  }

  const pendingInvites = invites.filter(i => !i.acceptedAt && new Date(i.expiresAt) > new Date())

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-400" />
            Gerenciar Usuários
          </h1>
          <p className="text-slate-400 mt-1">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Convidar usuário
        </button>
      </div>

      {/* Users table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left p-4 text-slate-400 font-medium text-sm">Usuário</th>
              <th className="text-left p-4 text-slate-400 font-medium text-sm">Papel / Plano</th>
              <th className="text-left p-4 text-slate-400 font-medium text-sm">Status</th>
              <th className="text-left p-4 text-slate-400 font-medium text-sm">Cadastro</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50">
                <td className="p-4">
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                  {user.organization && <p className="text-slate-500 text-xs">{user.organization}</p>}
                </td>
                <td className="p-4">
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded mr-1">{roleLabels[user.role] ?? user.role}</span>
                  <span className="text-xs bg-sky-900/50 text-sky-300 px-2 py-1 rounded">{planLabels[user.plan] ?? user.plan}</span>
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${user.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  {!user.emailVerified && (
                    <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded ml-1">E-mail pendente</span>
                  )}
                </td>
                <td className="p-4 text-slate-400 text-sm">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggle(user.id)}
                    disabled={togglingId === user.id}
                    className="text-slate-400 hover:text-white transition-colors"
                    title={user.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {togglingId === user.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : user.isActive ? (
                      <ToggleRight className="h-5 w-5 text-green-400" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-slate-600" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-yellow-400" />
              Convites pendentes ({pendingInvites.length})
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Convidado</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Papel / Plano</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Expira em</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {pendingInvites.map((invite) => (
                <tr key={invite.id} className="border-b border-slate-800 last:border-0">
                  <td className="p-4">
                    <p className="text-white font-medium">{invite.name}</p>
                    <p className="text-slate-400 text-sm">{invite.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded mr-1">{roleLabels[invite.role] ?? invite.role}</span>
                    <span className="text-xs bg-sky-900/50 text-sky-300 px-2 py-1 rounded">{planLabels[invite.plan] ?? invite.plan}</span>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">
                    {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Cancelar convite"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold text-lg">Convidar usuário</h2>
              <button onClick={() => { setShowModal(false); reset() }} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleInvite)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome completo</label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: Maria Silva"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="usuario@exemplo.com.br"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Papel</label>
                  <select {...register('role')} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="VIEWER">Visualizador</option>
                    <option value="ANALYST">Analista</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Plano</label>
                  <select {...register('plan')} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="FREE">Gratuito</option>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); reset() }} className="flex-1 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
