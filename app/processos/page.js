'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Layout from '../components/Layout'
import PageHeader, { Conteudo } from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import Avatar from '../components/Avatar'
import { cor, fonte, estilo, STATUS_PROCESSO, STATUS_PADRAO } from '../../lib/tema'
import { textoPrazo } from '../../lib/prazo'
import { FORMAS_APRESENTACAO, rotulo } from '../../lib/campos'

const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function BarraEtapa({ etapaOrdem, totalEtapas, corAtiva }) {
  const blocos = Array.from({ length: totalEtapas }, (_, i) => i < etapaOrdem)
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {blocos.map((ativo, i) => (
        <span key={i} style={{ width: '18px', height: '5px', borderRadius: '2px', background: ativo ? corAtiva : cor.borda }} />
      ))}
    </div>
  )
}

// Titular principal (e quantos mais) de um processo
function resumoTitulares(p) {
  const lista = p.processo_titulares || []
  if (lista.length === 0) return '—'
  const principal = lista.find(t => t.principal) || lista[0]
  const nome = principal.titulares?.nome_razao_social || '—'
  return lista.length > 1 ? `${nome} +${lista.length - 1}` : nome
}

function resumoClasses(p) {
  const lista = p.processo_classes || []
  if (lista.length === 0) return ''
  const principal = lista.find(c => c.classe_principal) || lista[0]
  return lista.length > 1 ? `NCL ${principal.classe_ncl} +${lista.length - 1}` : `NCL ${principal.classe_ncl}`
}

export default function Processos() {
  const [processos, setProcessos] = useState([])
  const [etapas, setEtapas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const router = useRouter()

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const [procRes, perfRes, etapasRes] = await Promise.all([
        supabase.from('processos')
          .select('*, etapas_processo(*), processo_titulares(principal, titulares(nome_razao_social)), processo_classes(classe_ncl, classe_principal)')
          .order('created_at', { ascending: false }),
        supabase.from('perfis').select('*'),
        supabase.from('etapas_processo').select('*').order('ordem', { ascending: true }),
      ])
      if (!ativo) return

      if (procRes.error) setErro('Não foi possível carregar os processos: ' + procRes.error.message)
      // processos.responsavel_id aponta para auth.users, então o responsável é ligado pela lista de perfis
      const perfisPorId = Object.fromEntries((perfRes.data || []).map(p => [p.id, p]))
      setProcessos((procRes.data || []).map(p => ({ ...p, perfis: perfisPorId[p.responsavel_id] || null })))
      setEtapas(etapasRes.data || [])
      setCarregando(false)
    }
    carregar()
    return () => { ativo = false }
  }, [router])

  async function excluir(id) {
    if (!confirm('Excluir este processo?')) return
    const { error } = await supabase.from('processos').delete().eq('id', id)
    if (error) {
      alert('Não foi possível excluir: ' + error.message)
      return
    }
    setProcessos(lista => lista.filter(p => p.id !== id))
  }

  const termo = normalizar(busca)
  const processosFiltrados = processos.filter(p => {
    if (!termo) return true
    return normalizar(`${p.marca || ''} ${p.numero_processo || ''} ${resumoTitulares(p)}`).includes(termo)
  })

  const totalEtapas = etapas.length || 7

  return (
    <Layout titulo="Processos" botaoAcao={{ label: 'Novo processo', onClick: () => router.push('/processos/novo') }}>
      <PageHeader
        titulo="Processos"
        descricao="Carteira completa de pedidos e registros de marca, com etapa atual, prazo vigente e responsável."
      >
        <button onClick={() => router.push('/processos/novo')} style={{ ...estilo.botaoPrimario, padding: '8px 14px' }}>+ Novo processo</button>
      </PageHeader>

      <Conteudo>
        <div style={{ ...estilo.cartao, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${cor.borda}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cor.textoClaro} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Marca, nº do processo ou titular..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', color: cor.texto, background: 'transparent' }} />
          </div>

          {erro && <p style={{ padding: '16px', color: cor.perigoTexto, fontSize: '14px', margin: 0 }}>{erro}</p>}

          {carregando ? (
            <p style={{ padding: '24px', color: cor.textoSec, fontSize: '14px', margin: 0 }}>Carregando...</p>
          ) : processosFiltrados.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: cor.textoSec, fontSize: '14px', margin: 0 }}>Nenhum processo encontrado.</p>
              <button onClick={() => router.push('/processos/novo')} style={{ marginTop: '12px', color: cor.primarioLink, background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' }}>
                + Cadastrar primeiro processo
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: cor.fundo, borderBottom: `1px solid ${cor.borda}` }}>
                    <th style={estilo.th}>Marca / titular</th>
                    <th style={estilo.th}>Processo</th>
                    <th style={estilo.th}>Status</th>
                    <th style={estilo.th}>Etapa do fluxo</th>
                    <th style={estilo.th}>Prazo</th>
                    <th style={estilo.th}>Responsável</th>
                    <th style={estilo.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {processosFiltrados.map((p) => {
                    const corStatus = STATUS_PROCESSO[p.status] || STATUS_PADRAO
                    const prazoInfo = textoPrazo(p.prazo)
                    const etapaNome = p.etapas_processo?.nome || '—'
                    const etapaOrdem = p.etapas_processo?.ordem || 0
                    const detalhes = [resumoClasses(p), rotulo(FORMAS_APRESENTACAO, p.forma_apresentacao) !== '—' ? rotulo(FORMAS_APRESENTACAO, p.forma_apresentacao) : ''].filter(Boolean).join(' · ')
                    return (
                      <tr key={p.id} style={{ borderTop: `1px solid ${cor.borda}` }}>
                        <td style={estilo.td}>
                          <button onClick={() => router.push(`/processos/${p.id}/editar`)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                            <div style={{ fontWeight: '600', color: cor.primarioLink }}>{p.marca}</div>
                            <div style={{ fontSize: '12px', color: cor.textoSec }}>{resumoTitulares(p)}</div>
                          </button>
                        </td>
                        <td style={{ ...estilo.td, color: cor.texto }}>
                          <div style={{ fontFamily: fonte.mono, fontSize: '12px' }}>{p.numero_processo || 'Pendente'}</div>
                          <div style={{ fontSize: '12px', color: cor.textoSec }}>{detalhes}</div>
                        </td>
                        <td style={estilo.td}>
                          <StatusBadge status={p.status} />
                        </td>
                        <td style={estilo.td}>
                          <BarraEtapa etapaOrdem={etapaOrdem} totalEtapas={totalEtapas} corAtiva={corStatus.ponto} />
                          <div style={{ fontSize: '12px', color: cor.textoSec, marginTop: '4px', whiteSpace: 'nowrap' }}>{etapaNome} · etapa {etapaOrdem} de {totalEtapas}</div>
                        </td>
                        <td style={{ ...estilo.td, whiteSpace: 'nowrap', color: prazoInfo.vencido ? cor.perigoTexto : cor.texto, fontWeight: prazoInfo.vencido ? '600' : '400' }}>
                          {prazoInfo.texto}
                        </td>
                        <td style={estilo.td}>
                          {p.perfis ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Avatar nome={p.perfis.nome || p.perfis.email} />
                              <span style={{ color: cor.texto }}>{p.perfis.nome || p.perfis.email}</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td style={{ ...estilo.td, textAlign: 'right' }}>
                          <button onClick={() => excluir(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cor.perigoTexto, fontSize: '13px', fontWeight: '500', fontFamily: 'inherit' }}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!carregando && processosFiltrados.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${cor.borda}`, fontSize: '13px', color: cor.textoSec }}>
              Exibindo <strong style={{ color: cor.texto }}>{processosFiltrados.length}</strong> de {processos.length} processos
            </div>
          )}
        </div>
      </Conteudo>
    </Layout>
  )
}
