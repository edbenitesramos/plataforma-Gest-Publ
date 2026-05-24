'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Scale, FileSearch, Eye, BarChart3,
  Brain, Globe, Settings, User, LogOut, ChevronDown,
  ChevronRight, ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { Logo } from '../logo/Logo'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/auth'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

const subsystems = [
  { href: '/dashboard/licitacoes', label: 'LicitaAlerta', icon: FileSearch },
  { href: '/dashboard/transparencia', label: 'TransparênciaPro', icon: Eye },
  { href: '/dashboard/raio-x', label: 'Raio-X Público', icon: BarChart3 },
  { href: '/dashboard/gov-analytics', label: 'GovAnalytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [subsOpen, setSubsOpen] = useState(pathname.startsWith('/dashboard/') && !pathname.startsWith('/dashboard/decisao'))
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const navLink = (href: string, icon: React.ElementType, label: string) => {
    const Icon = icon
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link key={href} href={href} className={cn('sidebar-link', active && 'active')}>
        <Icon size={18} />
        <span>{label}</span>
      </Link>
    )
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
    router.push('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-navy flex flex-col">
      <div className="p-5 border-b border-white/10">
        <Logo variant="dark" className="h-9" />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navLink('/dashboard', LayoutDashboard, 'Dashboard')}

        {/* Subsystems dropdown */}
        <button
          onClick={() => setSubsOpen(!subsOpen)}
          className="sidebar-link w-full justify-between"
        >
          <div className="flex items-center gap-3">
            <Scale size={18} />
            <span>Subsistemas</span>
          </div>
          {subsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {subsOpen && (
          <div className="ml-4 space-y-1">
            {subsystems.map(({ href, label, icon }) => navLink(href, icon, label))}
          </div>
        )}

        {navLink('/dashboard/decisao', Brain, 'Apoio à Decisão')}
        {navLink('/dashboard/configuracoes', Settings, 'Configurações')}
        {isAdmin && navLink('/dashboard/admin/usuarios', ShieldCheck, 'Usuários')}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        {navLink('/dashboard/configuracoes/perfil', User, 'Meu Perfil')}
        <button onClick={handleLogout} className="sidebar-link w-full">
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
