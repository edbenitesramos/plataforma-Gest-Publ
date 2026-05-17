import type { Metadata } from 'next'
import '@/styles/globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'EBR Consultoria — Plataforma de Dados Públicos',
  description: 'Análise de dados públicos e apoio à decisão para gestão pública',
  icons: { icon: '/logo.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
