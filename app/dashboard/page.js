'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { cor, estilo } from '../../lib/tema'

function Icone({ path }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

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
      icone: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      cor: cor.primarioLink,
      bg: cor.primarioSuave,
      sub: 'Total cadastrado'
    },
    {
      label: 'Processos ativos',
      valor: stats.totalProcessos,
      icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      cor: cor.primarioLink,
      bg: cor.primarioSuave,
      sub: 'Em andamento'
    },
    {
      label: 'Alertas pendentes',
      valor: stats.alertasPendentes,
      icone: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
      cor: cor.alertaTexto,
      bg: cor.alertaSuave,
      sub: 'Requerem atenção'
    },
    {
      label: 'Registros concedidos',
      valor: 0,
      icone: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
      cor: cor.sucessoTexto,
      bg: cor.sucessoSuave,
      sub: 'Concluídos com sucesso'
    },
  ]

  return (
    <Layout
      titulo="Painel"
      botaoAcao={{ label: 'Novo processo', onClick: () => router.push('/processos') }}
    >
      <PageHeader
        titulo="Painel operacional"
        descricao="Visão consolidada da sua carteira de marcas e processos."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((card) => (
          <div key={card.label} style={{ ...estilo.cartao, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', color: cor.textoSec, margin: 0 }}>{card.label}</p>
              <div style={{ background: card.bg, color: card.cor, borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icone path={card.icone} />
              </div>
            </div>
            <p style={{ fontSize: '32px', fontWeight: '600', color: cor.texto, margin: 0, letterSpacing: '-0.02em' }}>{card.valor}</p>
            <p style={{ fontSize: '12px', color: cor.textoSec, margin: '4px 0 0' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ ...estilo.cartao, padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: cor.texto, margin: '0 0 8px 0' }}>
          Bem-vindo ao PIOS
        </h2>
        <p style={{ fontSize: '14px', color: cor.textoSec, margin: 0 }}>
          Use o menu lateral para navegar entre os módulos.
        </p>
      </div>
    </Layout>
  )
}
