'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Verifica se o usuário está logado
    async function verificarUsuario() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Se não estiver logado, volta para o login
        router.push('/login')
      } else {
        setUsuario(session.user)
      }
    }

    verificarUsuario()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Barra superior */}
      <header className="bg-[#0F6E56] text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">PIOS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-80">{usuario.email}</span>
          <button
            onClick={handleLogout}
            className="bg-white text-[#0F6E56] px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo ao PIOS</h2>
        <p className="text-gray-500">O sistema está funcionando. Em breve os módulos estarão aqui.</p>
      </main>

    </div>
  )
}