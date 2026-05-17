'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo/Logo'
import { api } from '@/lib/api'

export default function EsqueciSenhaPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>()

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error('Erro ao processar solicitação')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="h-12" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">E-mail enviado</h2>
              <p className="text-gray-500 text-sm mb-6">Verifique sua caixa de entrada para o link de redefinição.</p>
              <Link href="/login" className="text-teal font-medium hover:underline">Voltar ao login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Esqueceu a senha?</h1>
              <p className="text-gray-500 text-sm mb-6">Informe seu e-mail e enviaremos um link de redefinição.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    {...register('email', { required: true })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    placeholder="seu@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-navy text-white py-2.5 rounded-lg font-medium hover:bg-navy/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Enviar link
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                <Link href="/login" className="text-teal font-medium hover:underline">Voltar ao login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
