'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo/Logo'
import { api } from '@/lib/api'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  organization: z.string().optional(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, '1 letra maiúscula')
    .regex(/[0-9]/, '1 número')
    .regex(/[^A-Za-z0-9]/, '1 caractere especial'),
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: 'Aceite os termos' }) }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 8, label: '8+ caracteres' },
    { ok: /[A-Z]/.test(password), label: 'Maiúscula' },
    { ok: /[0-9]/.test(password), label: 'Número' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Especial' },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-500']

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CadastroPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        organization: data.organization,
      })
      setRegistered(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar')
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verifique seu e-mail</h2>
          <p className="text-gray-500 text-sm mb-6">
            Enviamos um link de confirmação. Clique nele para ativar sua conta.
          </p>
          <Link href="/login" className="text-teal font-medium hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="h-12" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar conta</h1>
          <p className="text-gray-500 text-sm mb-6">Acesso gratuito à plataforma</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { id: 'name', label: 'Nome completo', type: 'text', placeholder: 'Seu nome', autocomplete: 'name' },
              { id: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com', autocomplete: 'email' },
              { id: 'organization', label: 'Organização (opcional)', type: 'text', placeholder: 'Ex: Prefeitura de...', autocomplete: 'organization' },
            ].map(({ id, label, type, placeholder, autocomplete }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  id={id}
                  type={type}
                  autoComplete={autocomplete}
                  {...register(id as keyof FormData)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                  placeholder={placeholder}
                />
                {errors[id as keyof FormData] && (
                  <p className="mt-1 text-xs text-red-600">{String(errors[id as keyof FormData]?.message)}</p>
                )}
              </div>
            ))}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                {...register('terms')}
                className="mt-0.5 w-4 h-4 accent-teal"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                Aceito os{' '}
                <Link href="/termos" className="text-teal hover:underline">Termos de Uso</Link>
                {' '}e{' '}
                <Link href="/privacidade" className="text-teal hover:underline">Política de Privacidade</Link>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-red-600">{errors.terms.message}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-navy text-white py-2.5 rounded-lg font-medium hover:bg-navy/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Criando conta...' : 'Criar conta gratuita'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Já tem conta?{' '}
            <Link href="/login" className="text-teal font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
