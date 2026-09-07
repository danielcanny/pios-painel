'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Layout from '../components/Layout'

const ORIGENS = ['Indicacao', 'Site', 'Instagram', 'Parceiro contador', 'Google', 'Outro']
const STATUS = ['lead', 'em negociacao', 'cliente ativo', 'inativo']
const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viuvo(a)', 'Uniao estavel']
const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const lbl = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#111827' }
const sec = { fontSize: '13px', fontWeight: '600', color: '#0F6E56', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }

function Input({ label, field, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(field, e.target.value)} placeholder={placeholder}
        style={inp} />
    </div>
  )
}

function Select({ label, field, value, onChange, options }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <select value={value} onChange={e => onChange(field, e.target.value)} style={inp}>
        <option value="">Selecione...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState(false)
  const [tipoPessoa, setTipoPessoa] = useState('PJ')
  const [form, setForm] = useState({
    tipo_pessoa: 'PJ',
    razao_social: '', nome_fantasia: '', cnpj: '', representante_nome: '', representante_cpf: '',
    nome_completo: '', cpf: '', nacionalidade: 'Brasileira', estado_civil: '', profissao: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    email: '', telefone: '', pessoa_contato: '',
    origem_lead: '', status: 'lead', responsavel: '',
    observacoes: ''
  })
  const router = useRouter()

  useEffect(() => {
    verificarSessao()
    buscarClientes()
  }, [])

  async function verificarSessao() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/login')
  }

  async function buscarClientes() {
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    setClientes(data || [])
    setCarregando(false)
  }

  async function buscarCep(cep) {
    const c = cep.replace(/\D/g, '')
    if (c.length !== 8) return
    const res = await fetch(`https://viacep.com.br/ws/${c}/json/`)
    const data = await res.json()
    if (!data.erro) {
      setForm(f => ({ ...f, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }))
    }
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    await supabase.from('clientes').insert([{ ...form, tipo_pessoa: tipoPessoa }])
    setMostrarForm(false)
    setSalvando(false)
    buscarClientes()
  }

  async function excluir(id) {
    if (!confirm('Excluir este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    buscarClientes()
  }

  const clientesFiltrados = clientes.filter(c => {
    const nome = c.tipo_pessoa === 'PJ' ? c.razao_social : c.nome_completo
    return nome?.toLowerCase().includes(busca.toLowerCase()) ||
      c.email?.toLowerCase().includes(busca.toLowerCase())
  })

  function nomeCliente(c) {
    return c.tipo_pessoa === 'PJ' ? (c.razao_social || '') : (c.nome_completo || '')
  }

  return (
    <Layout titulo="Clientes" botaoAcao={{ label: 'Novo cliente', onClick: () => setMostrarForm(true) }}>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Clientes</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Gerencie sua carteira de clientes.</p>
      </div>

      {/* Modal de cadastro */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '720px', padding: '32px', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0 }}>Novo Cliente</h2>
              <button onClick={() => setMostrarForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}>x</button>
            </div>

            <form onSubmit={salvar}>

              {/* Tipo de pessoa */}
              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Tipo de pessoa</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['PJ', 'PF'].map(t => (
                    <button key={t} type="button" onClick={() => setTipoPessoa(t)}
                      style={{ padding: '8px 24px', borderRadius: '8px', border: '2px solid', borderColor: tipoPessoa === t ? '#0F6E56' : '#e5e7eb', background: tipoPessoa === t ? '#0F6E56' : '#fff', color: tipoPessoa === t ? '#fff' : '#374151', fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}>
                      {t === 'PJ' ? 'Pessoa Juridica' : 'Pessoa Fisica'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos PJ */}
              {tipoPessoa === 'PJ' && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={sec}>Identificacao — Pessoa Juridica</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Input label="Razao social *" field="razao_social" value={form.razao_social} onChange={set} />
                    <Input label="Nome fantasia" field="nome_fantasia" value={form.nome_fantasia} onChange={set} />
                    <Input label="CNPJ" field="cnpj" value={form.cnpj} onChange={set} placeholder="00.000.000/0000-00" />
                    <div />
                    <Input label="Nome do representante legal" field="representante_nome" value={form.representante_nome} onChange={set} />
                    <Input label="CPF do representante" field="representante_cpf" value={form.representante_cpf} onChange={set} placeholder="000.000.000-00" />
                  </div>
                </div>
              )}

              {/* Campos PF */}
              {tipoPessoa === 'PF' && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={sec}>Identificacao — Pessoa Fisica</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Input label="Nome completo *" field="nome_completo" value={form.nome_completo} onChange={set} />
                    <Input label="CPF" field="cpf" value={form.cpf} onChange={set} placeholder="000.000.000-00" />
                    <Input label="Nacionalidade" field="nacionalidade" value={form.nacionalidade} onChange={set} />
                    <Select label="Estado civil" field="estado_civil" value={form.estado_civil} onChange={set} options={ESTADOS_CIVIS} />
                    <Input label="Profissao" field="profissao" value={form.profissao} onChange={set} />
                  </div>
                </div>
              )}

              {/* Endereco */}
              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Endereco</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={lbl}>CEP</label>
                    <input value={form.cep} onChange={e => { set('cep', e.target.value); buscarCep(e.target.value) }}
                      placeholder="00000-000" style={inp} />
                  </div>
                  <Input label="Logradouro" field="logradouro" value={form.logradouro} onChange={set} />
                  <Input label="Numero" field="numero" value={form.numero} onChange={set} />
                  <Input label="Complemento" field="complemento" value={form.complemento} onChange={set} />
                  <Input label="Bairro" field="bairro" value={form.bairro} onChange={set} />
                  <Input label="Cidade" field="cidade" value={form.cidade} onChange={set} />
                  <div>
                    <label style={lbl}>Estado</label>
                    <select value={form.estado} onChange={e => set('estado', e.target.value)} style={inp}>
                      <option value="">Selecione...</option>
                      {ESTADOS_BR.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Contato</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input label="E-mail" field="email" value={form.email} onChange={set} type="email" />
                  <Input label="Telefone / WhatsApp" field="telefone" value={form.telefone} onChange={set} placeholder="(00) 00000-0000" />
                  {tipoPessoa === 'PJ' && <Input label="Pessoa de contato" field="pessoa_contato" value={form.pessoa_contato} onChange={set} />}
                </div>
              </div>

              {/* Dados comerciais */}
              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Dados comerciais</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Select label="Origem do lead" field="origem_lead" value={form.origem_lead} onChange={set} options={ORIGENS} />
                  <Select label="Status" field="status" value={form.status} onChange={set} options={STATUS} />
                  <Input label="Responsavel interno" field="responsavel" value={form.responsavel} onChange={set} />
                </div>
              </div>

              {/* Observacoes */}
              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Observacoes</p>
                <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                  rows={3} placeholder="Anotacoes internas sobre este cliente..."
                  style={{ ...inp, resize: 'vertical' }} />
              </div>

              {/* Botoes */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setMostrarForm(false)}
                  style={{ padding: '9px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#374151' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  style={{ padding: '9px 24px', border: 'none', borderRadius: '8px', background: '#0F6E56', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando...' : 'Salvar cliente'}
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
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }} />
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{clientesFiltrados.length} cliente(s)</span>
        </div>

        {carregando ? (
          <p style={{ padding: '24px', color: '#9ca3af', fontSize: '14px' }}>Carregando...</p>
        ) : clientesFiltrados.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Nenhum cliente encontrado.</p>
            <button onClick={() => setMostrarForm(true)} style={{ marginTop: '12px', color: '#0F6E56', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
              + Cadastrar primeiro cliente
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Nome</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>E-mail</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>Cidade</th>
                <th style={{ padding: '12px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c, i) => (
                <tr key={c.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1f2937' }}>{nomeCliente(c)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '99px', background: c.tipo_pessoa === 'PJ' ? '#eff6ff' : '#f0fdf4', color: c.tipo_pessoa === 'PJ' ? '#2563eb' : '#16a34a', fontWeight: '500' }}>
                      {c.tipo_pessoa}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{c.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '99px', background: c.status === 'cliente ativo' ? '#f0fdf4' : '#f9fafb', color: c.status === 'cliente ativo' ? '#16a34a' : '#6b7280', fontWeight: '500' }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{c.cidade}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => excluir(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '13px', fontWeight: '500' }}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}