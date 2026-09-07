'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Layout from '../components/Layout'

const NATUREZAS = ['Nominativa', 'Mista', 'Figurativa']
const STATUS_OPCOES = ['Em andamento', 'Prazo vencido', 'Requer atenção', 'Arquivado', 'Concluído']

const STATUS_CORES = {
  'Em andamento': { bg: '#eff6ff', color: '#2563eb' },
  'Prazo vencido': { bg: '#fef2f2', color: '#dc2626' },
  'Requer atenção': { bg: '#fff7ed', color: '#ea580c' },
  'Arquivado': { bg: '#f9fafb', color: '#6b7280' },
  'Concluído': { bg: '#f0fdf4', color: '#16a34a' },
}

const lbl = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#111827' }
const sec = { fontSize: '13px', fontWeight: '600', color: '#0F6E56', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }

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
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          {filtrados.map(c => (
            <div key={c.id}
              onMouseDown={() => { onSelect(c.id); setAberto(false) }}
              style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              <div style={{ fontWeight: '500', color: '#1f2937' }}>{nomeCliente(c)}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{c.tipo_pessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Avatar({ nome }) {
  const iniciais = (nome || '?').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
  return (
    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0F6E56', color: '#fff', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {iniciais}
    </span>
  )
}

function BarraEtapa({ etapaOrdem, totalEtapas }) {
  const blocos = Array.from({ length: totalEtapas }, (_, i) => i < etapaOrdem)
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {blocos.map((ativo, i) => (
        <span key={i} style={{ width: '18px', height: '5px', borderRadius: '2px', background: ativo ? '#0F6E56' : '#e5e7eb' }} />
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

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Processos</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Carteira completa de pedidos e registros de marca, com etapa atual, prazo vigente e responsável.</p>
        </div>
      </div>

      {/* Modal de cadastro */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '720px', padding: '32px', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0 }}>Novo Processo</h2>
              <button onClick={() => setMostrarForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}>x</button>
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
                <button type="button" onClick={() => setMostrarForm(false)}
                  style={{ padding: '9px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#374151' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  style={{ padding: '9px 24px', border: 'none', borderRadius: '8px', background: '#0F6E56', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando...' : 'Salvar processo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Marca, nº do processo ou titular..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }} />
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{processosFiltrados.length} processo(s)</span>
        </div>

        {carregando ? (
          <p style={{ padding: '24px', color: '#9ca3af', fontSize: '14px' }}>Carregando...</p>
        ) : processosFiltrados.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Nenhum processo encontrado.</p>
            <button onClick={abrirNovo} style={{ marginTop: '12px', color: '#0F6E56', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
              + Cadastrar primeiro processo
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Marca / titular</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Processo</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Etapa do fluxo</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Prazo</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Responsável</th>
                <th style={{ padding: '12px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {processosFiltrados.map((p, i) => {
                const titular = p.clientes ? (p.clientes.tipo_pessoa === 'PJ' ? p.clientes.razao_social : p.clientes.nome_completo) : '—'
                const corStatus = STATUS_CORES[p.status] || { bg: '#f9fafb', color: '#6b7280' }
                const prazoInfo = textoPrazo(p.prazo)
                const etapaNome = p.etapas_processo?.nome || '—'
                const etapaOrdem = p.etapas_processo?.ordem || 0
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => router.push(`/processos/${p.id}`)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', color: '#0F6E56' }}>{p.marca}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{titular}</div>
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>
                      <div>{p.numero_processo || '—'}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>{p.classe_nice ? `NCL ${p.classe_nice}` : ''}{p.natureza ? ` · ${p.natureza}` : ''}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '99px', background: corStatus.bg, color: corStatus.color, fontWeight: '500' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <BarraEtapa etapaOrdem={etapaOrdem} totalEtapas={totalEtapas} />
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{etapaNome} · etapa {etapaOrdem} de {totalEtapas}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: prazoInfo.vencido ? '#dc2626' : '#374151', fontWeight: prazoInfo.vencido ? '600' : '400' }}>
                      {prazoInfo.texto}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.perfis ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Avatar nome={p.perfis.nome || p.perfis.email} />
                          <span style={{ color: '#374151' }}>{p.perfis.nome || p.perfis.email}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => excluir(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '13px', fontWeight: '500' }}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}