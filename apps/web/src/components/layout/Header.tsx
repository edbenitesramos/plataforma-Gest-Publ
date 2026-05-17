'use client'

import { Bell, User } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-800">{title ?? 'EBR Consultoria'}</h1>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-navy rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800">{user?.name ?? '...'}</p>
            <p className="text-xs text-gray-500">{user?.plan ?? 'FREE'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
