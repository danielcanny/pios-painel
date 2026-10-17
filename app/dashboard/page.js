'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '../components/Layout'
import PageHeader, { Conteudo } from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import GraficoArea from '../components/GraficoArea'
import { cor, fonte, estilo, STATUS_PROCESSO, STATUS_PADRAO } from '../../lib/tema'
import { diasRestantes, tempoRelativo } from '../../lib/prazo'

const FECHADOS = ['Concluído', 'Arquivado']
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function Icone({ path }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function nomeProcesso(p) {
  return p.marca || 'Sem marca'
}

function listaNomes(nomes) {
  if (nomes.length === 0) return ''
  if (nomes.length === 1) return nomes[0]
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

function Cartao({ titulo, descricao, acao, children }) {
  return (
    <div style={{ ...estilo.cartao, padding: '20px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: cor.texto, margin: 0 }}>{titulo}</h2>
          {descricao && <p style={{ fontSize: '13px', color: cor.textoSec, margin: '2px 0 0' }}>{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const [processos, setProcessos] = useState([])
  const [etapas, setEtapas] = useState([])
  const [movimentacoes, setMovimentacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let ativo = true

    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const [procRes, etapasRes, movRes] = await Promise.all([
        supabase.from('processos').select('*, perfis(*)').order('created_at', { ascending: false }),
        supabase.from('etapas_processo').select('*').order('ordem', { ascending: true }),
        supabase.from('movimentacoes').select('*').order('created_at', { ascending: false }).limit(5),
      ])

      if (!ativo) return
      setProcessos(procRes.data || [])
      setEtapas(etapasRes.data || [])
      setMovimentacoes(movRes.data || [])
      setCarregando(false)
    }

    carregar()
    return () => { ativo = false }
  }, [router])

  const ativos = processos.filter(p => !FECHADOS.includes(p.status))
  const agora = new Date()
  const cadastradosNoMes = processos.filter(p => {
    const d = new Date(p.created_at)
    return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth()
  }).length

  const prazoEm = p => diasRestantes(p.prazo)
  const em15 = ativos.filter(p => prazoEm(p) !== null && prazoEm(p) >= 0 && prazoEm(p) <= 15)
  const em7 = em15.filter(p => prazoEm(p) <= 7)
  const vencidos = ativos.filter(p => prazoEm(p) !== null && prazoEm(p) < 0)
  const concedidos = processos.filter(p => p.status === 'Concluído')

  const cards = [
    {
      label: 'Processos ativos',
      valor: ativos.length,
      sub: `${cadastradosNoMes} cadastrado(s) neste mês`,
      icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      cor: cor.primarioLink, bg: cor.primarioSuave,
    },
    {
      label: 'Prazos em 15 dias',
      valor: em15.length,
      sub: `${em7.length} vence(m) em até 7 dias`,
      icone: 'M12 6v6l4 2M22 12a10 10 0 11-20 0 10 10 0 0120 0z',
      cor: cor.alertaTexto, bg: cor.alertaSuave,
    },
    {
      label: 'Prazos vencidos',
      valor: vencidos.length,
      sub: vencidos.length ? listaNomes(vencidos.slice(0, 2).map(nomeProcesso)) : 'Nenhum prazo vencido',
      icone: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
      cor: cor.perigoTexto, bg: cor.perigoSuave,
    },
    {
      label: 'Registros concedidos',
      valor: concedidos.length,
      sub: 'Processos concluídos',
      icone: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
      cor: cor.sucessoTexto, bg: cor.sucessoSuave,
    },
  ]

  // Depósitos (processos cadastrados) por mês, nos últimos 6 meses
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1)
    return { ano: d.getFullYear(), mes: d.getMonth(), rotulo: MESES[d.getMonth()] }
  })
  const depositos = meses.map(m => ({
    rotulo: m.rotulo,
    valor: processos.filter(p => {
      const d = new Date(p.created_at)
      return d.getFullYear() === m.ano && d.getMonth() === m.mes
    }).length,
  }))

  // Carteira ativa por etapa
  const porEtapa = etapas.map(e => ({
    nome: e.nome,
    valor: ativos.filter(p => p.etapa_id === e.id).length,
  }))
  const maxEtapa = Math.max(1, ...porEtapa.map(e => e.valor))

  // Prazos críticos: ativos com prazo, do mais urgente para o menos urgente
  const criticos = ativos
    .filter(p => p.prazo)
    .sort((a, b) => prazoEm(a) - prazoEm(b))
    .slice(0, 5)

  const marcaPorId = Object.fromEntries(processos.map(p => [p.id, p.marca]))

  return (
    <Layout
      titulo="Painel"
      botaoAcao={{ label: 'Novo processo', onClick: () => router.push('/processos?novo=1') }}
    >
      <PageHeader
        titulo="Painel operacional"
        descricao="Visão consolidada da carteira de marcas, prazos do INPI e produtividade da equipe."
      >
        <button onClick={() => router.push('/processos?novo=1')} style={{ ...estilo.botaoPrimario, padding: '8px 14px' }}>
          + Novo processo
        </button>
      </PageHeader>

      <Conteudo>
        {/* Indicadores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {cards.map((card) => (
            <div key={card.label} style={{ ...estilo.cartao, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <p style={{ fontSize: '14px', color: cor.textoSec, margin: 0 }}>{card.label}</p>
                <div style={{ background: card.bg, color: card.cor, borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icone path={card.icone} />
                </div>
              </div>
              <p style={{ fontSize: '30px', fontWeight: '600', color: cor.texto, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{carregando ? '–' : card.valor}</p>
              <p style={{ fontSize: '12px', color: cor.textoSec, margin: '8px 0 0' }}>{carregando ? ' ' : card.sub}</p>
            </div>
          ))}
        </div>

        {/* Gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <Cartao titulo="Depósitos por mês" descricao="Últimos 6 meses · processos cadastrados">
            <GraficoArea dados={depositos} />
          </Cartao>

          <Cartao titulo="Carteira por etapa" descricao={`Distribuição dos ${ativos.length} processos ativos no fluxo do INPI`}>
            {porEtapa.length === 0 ? (
              <p style={{ fontSize: '14px', color: cor.textoSec, margin: 0 }}>Nenhuma etapa cadastrada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {porEtapa.map(e => (
                  <div key={e.nome} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 28px', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: cor.textoSec, textAlign: 'right' }}>{e.nome}</span>
                    <div style={{ background: cor.fundoSuave, borderRadius: '4px', height: '14px' }}>
                      <div style={{ width: `${(e.valor / maxEtapa) * 100}%`, minWidth: e.valor ? '4px' : 0, height: '100%', borderRadius: '4px', background: cor.primario }} />
                    </div>
                    <span style={{ fontSize: '12px', color: cor.texto, fontWeight: '500' }}>{e.valor}</span>
                  </div>
                ))}
              </div>
            )}
          </Cartao>
        </div>

        {/* Prazos críticos e movimentações */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '16px' }}>
          <Cartao
            titulo="Prazos críticos"
            descricao="Ordenados por urgência de manifestação"
            acao={<Link href="/processos" style={{ fontSize: '13px', fontWeight: '500', color: cor.texto, textDecoration: 'none', whiteSpace: 'nowrap' }}>Ver todos →</Link>}
          >
            {criticos.length === 0 ? (
              <p style={{ fontSize: '14px', color: cor.textoSec, margin: 0 }}>Nenhum prazo em aberto.</p>
            ) : (
              <div>
                {criticos.map((p, i) => {
                  const dias = prazoEm(p)
                  const st = STATUS_PROCESSO[p.status] || STATUS_PADRAO
                  const textoDias = dias < 0 ? `vencido há ${Math.abs(dias)} dia(s)` : dias === 0 ? 'vence hoje' : `em ${dias} dia(s)`
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${cor.borda}` }}>
                      <span style={{ width: '3px', alignSelf: 'stretch', borderRadius: '2px', background: dias < 0 ? cor.perigo : st.ponto }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: cor.texto }}>{nomeProcesso(p)}</div>
                        <div style={{ fontFamily: fonte.mono, fontSize: '11px', color: cor.textoSec }}>{p.numero_processo || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: dias < 0 ? cor.perigoTexto : cor.texto }}>{textoDias}</div>
                        <div style={{ fontSize: '11px', color: cor.textoSec }}>{p.perfis?.nome || p.perfis?.email || '—'}</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  )
                })}
              </div>
            )}
          </Cartao>

          <Cartao titulo="Movimentações recentes" descricao="Últimos registros do histórico dos processos">
            {movimentacoes.length === 0 ? (
              <p style={{ fontSize: '14px', color: cor.textoSec, margin: 0 }}>Nenhuma movimentação registrada ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {movimentacoes.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cor.fundoSuave, color: cor.textoSec, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icone path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: cor.texto }}>{m.titulo}</div>
                      <div style={{ fontSize: '12px', color: cor.textoSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[marcaPorId[m.processo_id], m.descricao].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: cor.textoSec, whiteSpace: 'nowrap' }}>{tempoRelativo(m.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Cartao>
        </div>
      </Conteudo>
    </Layout>
  )
}
