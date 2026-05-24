'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo/Logo'
import { Mail } from 'lucide-react'

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="h-12" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-sky-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-sky-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Acesso por convite</h1>
          <p className="text-slate-400 mb-2">
            O cadastro nesta plataforma é exclusivo para usuários convidados.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Entre em contato com o administrador da sua organização para receber um convite de acesso.
          </p>

          <Link
            href="/login"
            className="inline-block w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
