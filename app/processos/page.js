'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import Avatar from '../components/Avatar'
import { cor, fonte, estilo, STATUS_PROCESSO, STATUS_PADRAO } from '../../lib/tema'

const NATUREZAS = ['Nominativa', 'Mista', 'Figurativa']
const STATUS_OPCOES = ['Em andamento', 'Prazo vencido', 'Requer atenção', 'Arquivado', 'Concluído']

const lbl = estilo.label
const inp = estilo.input
const sec = estilo.secao

function Input({ label, field, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(field, e.target.value)} placeholder={placeholder}
        style={inp} />
    </div>
  )
}

function Select({ label, field, value, onChange, options }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <select value={value || ''} onChange={e => onChange(field, e.target.value)} style={inp}>
        <option value="">Selecione...</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  )
}

function ClienteAutocomplete({ clientes, value, onSelect }) {
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)

  const clienteSelecionado = clientes.find(c => c.id === value)

  const nomeCliente = (c) => c.tipo_pessoa === 'PJ' ? (c.razao_social || '') : (c.nome_completo || '')

  const filtrados = useMemo(() => {
    if (!termo) return clientes.slice(0, 8)
    return clientes.filter(c => nomeCliente(c).toLowerCase().includes(termo.toLowerCase())).slice(0, 8)
  }, [termo, clientes])

  return (
    <div style={{ position: 'relative' }}>
      <label style={lbl}>Cliente / Titular *</label>
      <input
        value={aberto ? termo : (clienteSelecionado ? nomeCliente(clienteSelecionado) : '')}
        onChange={e => { setTermo(e.target.value); setAberto(true) }}
        onFocus={() => { setTermo(''); setAberto(true) }}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="Buscar cliente..."
        style={inp}
      />
      {aberto && filtrados.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: cor.card, border: `1px solid ${cor.borda}`, borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(15,23,42,0.10)' }}>
          {filtrados.map(c => (
            <div key={c.id}
              onMouseDown={() => { onSelect(c.id); setAberto(false) }}
              style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer', borderBottom: `1px solid ${cor.fundoSuave}` }}
              onMouseEnter={e => e.currentTarget.style.background = cor.fundo}
              onMouseLeave={e => e.currentTarget.style.background = cor.card}>
              <div style={{ fontWeight: '500', color: cor.texto }}>{nomeCliente(c)}</div>
              <div style={{ fontSize: '12px', color: cor.textoSec }}>{c.tipo_pessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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

function diasRestantes(prazo) {
  if (!prazo) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const data = new Date(prazo + 'T00:00:00')
  const diff = Math.round((data - hoje) / (1000 * 60 * 60 * 24))
  return diff
}

function textoPrazo(prazo) {
  const dias = diasRestantes(prazo)
  if (dias === null) return { texto: '—', vencido: false }
  if (dias < 0) return { texto: `vencido há ${Math.abs(dias)} dia(s)`, vencido: true }
  if (dias === 0) return { texto: 'vence hoje', vencido: false, urgente: true }
  return { texto: `em ${dias} dia(s)`, vencido: false }
}

export default function Processos() {
  const [processos, setProcessos] = useState([])
  const [clientes, setClientes] = useState([])
  const [perfis, setPerfis] = useState([])
  const [etapas, setEtapas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState({
    marca: '', numero_processo: '', cliente_id: '', classe_nice: '', natureza: '',
    responsavel_id: '', status: 'Em andamento', prazo: '', notas: ''
  })
  const router = useRouter()

  useEffect(() => {
    verificarSessao()
    carregarTudo()
  }, [])

  async function verificarSessao() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/login')
  }

  async function carregarTudo() {
    setCarregando(true)
    const [procRes, cliRes, perfRes, etapasRes] = await Promise.all([
      supabase.from('processos').select('*, clientes(*), perfis(*), etapas_processo(*)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('*'),
      supabase.from('perfis').select('*'),
      supabase.from('etapas_processo').select('*').order('ordem', { ascending: true }),
    ])
    setProcessos(procRes.data || [])
    setClientes(cliRes.data || [])
    setPerfis(perfRes.data || [])
    setEtapas(etapasRes.data || [])
    setCarregando(false)
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function abrirNovo() {
    setForm({
      marca: '', numero_processo: '', cliente_id: '', classe_nice: '', natureza: '',
      responsavel_id: '', status: 'Em andamento', prazo: '', notas: ''
    })
    setMostrarForm(true)
  }

  async function salvar(e) {
    e.preventDefault()
    if (!form.marca || !form.cliente_id) {
      alert('Preencha ao menos a Marca e o Cliente/Titular.')
      return
    }
    setSalvando(true)
    const etapaInicial = etapas.find(e => e.ordem === 1)
    await supabase.from('processos').insert([{
      ...form,
      prazo: form.prazo || null,
      etapa_id: etapaInicial ? etapaInicial.id : null,
    }])
    setMostrarForm(false)
    setSalvando(false)
    carregarTudo()
  }

  async function excluir(id) {
    if (!confirm('Excluir este processo?')) return
    await supabase.from('processos').delete().eq('id', id)
    carregarTudo()
  }

  const processosFiltrados = processos.filter(p => {
    const termo = busca.toLowerCase()
    const nomeTitular = p.clientes ? (p.clientes.tipo_pessoa === 'PJ' ? p.clientes.razao_social : p.clientes.nome_completo) : ''
    return (p.marca || '').toLowerCase().includes(termo) ||
      (p.numero_processo || '').toLowerCase().includes(termo) ||
      (nomeTitular || '').toLowerCase().includes(termo)
  })

  const totalEtapas = etapas.length || 7

  return (
    <Layout titulo="Processos" botaoAcao={{ label: 'Novo processo', onClick: abrirNovo }}>

      <PageHeader
        titulo="Processos"
        descricao="Carteira completa de pedidos e registros de marca, com etapa atual, prazo vigente e responsável."
      />

      {/* Modal de cadastro */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(18,18,20,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
          <div style={{ background: cor.card, borderRadius: '16px', width: '100%', maxWidth: '720px', padding: '32px', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: cor.texto, margin: 0 }}>Novo processo</h2>
              <button onClick={() => setMostrarForm(false)} aria-label="Fechar" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: cor.textoSec }}>x</button>
            </div>

            <form onSubmit={salvar}>

              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Identificação do processo</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input label="Marca *" field="marca" value={form.marca} onChange={set} placeholder="Ex: Tramo" />
                  <Input label="Número do processo" field="numero_processo" value={form.numero_processo} onChange={set} placeholder="BR 00.000.000" />
                  <Input label="Classe de Nice (NCL)" field="classe_nice" value={form.classe_nice} onChange={set} placeholder="Ex: 42" />
                  <Select label="Natureza" field="natureza" value={form.natureza} onChange={set} options={NATUREZAS} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Titular e responsável</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <ClienteAutocomplete clientes={clientes} value={form.cliente_id} onSelect={id => set('cliente_id', id)} />
                  <Select label="Responsável interno" field="responsavel_id" value={form.responsavel_id} onChange={set}
                    options={perfis.map(p => ({ value: p.id, label: p.nome || p.email }))} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Status e prazo</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Select label="Status" field="status" value={form.status} onChange={set} options={STATUS_OPCOES} />
                  <Input label="Prazo vigente" field="prazo" type="date" value={form.prazo} onChange={set} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Observações</p>
                <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
                  rows={3} placeholder="Anotações internas sobre este processo..."
                  style={{ ...inp, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setMostrarForm(false)} style={estilo.botaoSecundario}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  style={{ ...estilo.botaoPrimario, padding: '9px 24px', opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando...' : 'Salvar processo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ ...estilo.cartao, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${cor.borda}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cor.textoClaro} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Marca, nº do processo ou titular..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', color: cor.texto, background: 'transparent' }} />
        </div>

        {carregando ? (
          <p style={{ padding: '24px', color: cor.textoSec, fontSize: '14px', margin: 0 }}>Carregando...</p>
        ) : processosFiltrados.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: cor.textoSec, fontSize: '14px', margin: 0 }}>Nenhum processo encontrado.</p>
            <button onClick={abrirNovo} style={{ marginTop: '12px', color: cor.primarioLink, background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' }}>
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
                const titular = p.clientes ? (p.clientes.tipo_pessoa === 'PJ' ? p.clientes.razao_social : p.clientes.nome_completo) : '—'
                const corStatus = STATUS_PROCESSO[p.status] || STATUS_PADRAO
                const prazoInfo = textoPrazo(p.prazo)
                const etapaNome = p.etapas_processo?.nome || '—'
                const etapaOrdem = p.etapas_processo?.ordem || 0
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${cor.borda}` }}>
                    <td style={estilo.td}>
                      <button onClick={() => router.push(`/processos/${p.id}`)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                        <div style={{ fontWeight: '600', color: cor.primarioLink }}>{p.marca}</div>
                        <div style={{ fontSize: '12px', color: cor.textoSec }}>{titular}</div>
                      </button>
                    </td>
                    <td style={{ ...estilo.td, color: cor.texto }}>
                      <div style={{ fontFamily: fonte.mono, fontSize: '12px' }}>{p.numero_processo || '—'}</div>
                      <div style={{ fontSize: '12px', color: cor.textoSec }}>{p.classe_nice ? `NCL ${p.classe_nice}` : ''}{p.natureza ? ` · ${p.natureza}` : ''}</div>
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
    </Layout>
  )
}