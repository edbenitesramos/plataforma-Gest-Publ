'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo/Logo'
import { api } from '@/lib/api'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, '1 letra maiúscula')
    .regex(/[0-9]/, '1 número')
    .regex(/[^A-Za-z0-9]/, '1 caractere especial'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/api/auth/accept-invite', { token, password: data.password })
      setDone(true)
      toast.success('Conta criada! Faça login.')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao ativar conta.')
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center text-white">
          <p>Link de convite inválido.</p>
          <Link href="/login" className="text-sky-400 underline mt-4 block">Ir para login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Ativar sua conta</h1>
          <p className="text-slate-400 mt-2">Defina uma senha para acessar a plataforma</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          {done ? (
            <div className="text-center text-green-400 py-8">
              <p className="text-lg font-semibold">Conta criada com sucesso!</p>
              <p className="text-slate-400 mt-2">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nova senha</label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Mínimo 8 caracteres"
                />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar senha</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Repita a senha"
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Ativar conta
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
