'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null)
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalProcessos: 0,
    alertasPendentes: 0,
  })
  const router = useRouter()

  useEffect(() => {
    verificarUsuario()
    buscarStats()
  }, [])

  async function verificarUsuario() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/login')
    else setUsuario(session.user)
  }

  async function buscarStats() {
    const { count: totalClientes } = await supabase
      .from('clientes').select('*', { count: 'exact', head: true })

    const { count: totalProcessos } = await supabase
      .from('processos').select('*', { count: 'exact', head: true })

    const { count: alertasPendentes } = await supabase
      .from('alertas').select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')

    setStats({
      totalClientes: totalClientes || 0,
      totalProcessos: totalProcessos || 0,
      alertasPendentes: alertasPendentes || 0,
    })
  }

  const cards = [
    {
      label: 'Clientes ativos',
      valor: stats.totalClientes,
      icon: '👤',
      cor: '#0F6E56',
      bg: 'rgba(15,110,86,0.1)',
      sub: 'Total cadastrado'
    },
    {
      label: 'Processos ativos',
      valor: stats.totalProcessos,
      icon: '◫',
      cor: '#2563eb',
      bg: '#eff6ff',
      sub: 'Em andamento'
    },
    {
      label: 'Alertas pendentes',
      valor: stats.alertasPendentes,
      icon: '🔔',
      cor: '#f97316',
      bg: '#fff7ed',
      sub: 'Requerem atencao'
    },
    {
      label: 'Registros concedidos',
      valor: 0,
      icon: '✅',
      cor: '#16a34a',
      bg: '#f0fdf4',
      sub: 'Concluidos com sucesso'
    },
  ]

  return (
    <Layout
      titulo="Painel"
      botaoAcao={{ label: 'Novo processo', onClick: () => router.push('/processos/novo') }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Painel operacional</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Visao consolidada da sua carteira de marcas e processos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {cards.map((card) => (
          <div key={card.label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{card.label}</p>
              <div style={{ background: card.bg, borderRadius: '8px', padding: '8px', fontSize: '18px' }}>
                {card.icon}
              </div>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: card.cor, margin: 0 }}>{card.valor}</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
          Bem-vindo ao PIOS 👋
        </h2>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
          Use o menu lateral para navegar entre os modulos.
        </p>
      </div>
    </Layout>
  )
}