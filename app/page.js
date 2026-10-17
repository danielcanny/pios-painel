'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function decidirRota() {
      const { data: { session } } = await supabase.auth.getSession()
      router.replace(session ? '/dashboard' : '/login')
    }
    decidirRota()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontFamily: 'sans-serif' }}>
      Carregando...
    </div>
  )
}
