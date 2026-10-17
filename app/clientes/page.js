'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { cor, estilo } from '../../lib/tema'

const ORIGENS = ['Indicacao', 'Site', 'Instagram', 'Parceiro contador', 'Google', 'Outro']
const STATUS = ['lead', 'em negociacao', 'cliente ativo', 'inativo']
const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viuvo(a)', 'Uniao estavel']
const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const lbl = estilo.label
const inp = estilo.input
const sec = estilo.secao

const STATUS_CLIENTE = {
  'lead': { bg: cor.primarioSuave, texto: cor.primarioLink },
  'em negociacao': { bg: cor.alertaSuave, texto: cor.alertaTexto },
  'cliente ativo': { bg: cor.sucessoSuave, texto: cor.sucessoTexto },
  'inativo': { bg: cor.fundoSuave, texto: cor.textoSec },
}

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
  const [busca, setBusca] = useState('')
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

      <PageHeader titulo="Clientes" descricao="Gerencie sua carteira de clientes." />

      {/* Modal de cadastro */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(18,18,20,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
          <div style={{ background: cor.card, borderRadius: '16px', width: '100%', maxWidth: '720px', padding: '32px', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: cor.texto, margin: 0 }}>Novo cliente</h2>
              <button onClick={() => setMostrarForm(false)} aria-label="Fechar" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: cor.textoSec }}>x</button>
            </div>

            <form onSubmit={salvar}>

              {/* Tipo de pessoa */}
              <div style={{ marginBottom: '24px' }}>
                <p style={sec}>Tipo de pessoa</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['PJ', 'PF'].map(t => (
                    <button key={t} type="button" onClick={() => setTipoPessoa(t)}
                      style={{ padding: '8px 24px', borderRadius: '8px', border: '1px solid', borderColor: tipoPessoa === t ? cor.primario : cor.borda, background: tipoPessoa === t ? cor.primario : cor.card, color: tipoPessoa === t ? cor.primarioTexto : cor.texto, fontWeight: '500', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
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
                <button type="button" onClick={() => setMostrarForm(false)} style={estilo.botaoSecundario}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  style={{ ...estilo.botaoPrimario, padding: '9px 24px', opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando...' : 'Salvar cliente'}
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
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', color: cor.texto, background: 'transparent' }} />
        </div>

        {carregando ? (
          <p style={{ padding: '24px', color: cor.textoSec, fontSize: '14px', margin: 0 }}>Carregando...</p>
        ) : clientesFiltrados.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: cor.textoSec, fontSize: '14px', margin: 0 }}>Nenhum cliente encontrado.</p>
            <button onClick={() => setMostrarForm(true)} style={{ marginTop: '12px', color: cor.primarioLink, background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' }}>
              + Cadastrar primeiro cliente
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: cor.fundo, borderBottom: `1px solid ${cor.borda}` }}>
                <th style={estilo.th}>Nome</th>
                <th style={estilo.th}>Tipo</th>
                <th style={estilo.th}>E-mail</th>
                <th style={estilo.th}>Status</th>
                <th style={estilo.th}>Cidade</th>
                <th style={estilo.th}></th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c) => {
                const corStatus = STATUS_CLIENTE[c.status] || STATUS_CLIENTE['inativo']
                return (
                <tr key={c.id} style={{ borderTop: `1px solid ${cor.borda}` }}>
                  <td style={{ ...estilo.td, fontWeight: '500', color: cor.texto }}>{nomeCliente(c)}</td>
                  <td style={estilo.td}>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '99px', background: cor.fundoSuave, color: cor.textoSec, fontWeight: '500' }}>
                      {c.tipo_pessoa}
                    </span>
                  </td>
                  <td style={{ ...estilo.td, color: cor.textoSec }}>{c.email}</td>
                  <td style={estilo.td}>
                    <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '99px', background: corStatus.bg, color: corStatus.texto, fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ ...estilo.td, color: cor.textoSec }}>{c.cidade}</td>
                  <td style={{ ...estilo.td, textAlign: 'right' }}>
                    <button onClick={() => excluir(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cor.perigoTexto, fontSize: '13px', fontWeight: '500', fontFamily: 'inherit' }}>
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

        {!carregando && clientesFiltrados.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${cor.borda}`, fontSize: '13px', color: cor.textoSec }}>
            Exibindo <strong style={{ color: cor.texto }}>{clientesFiltrados.length}</strong> de {clientes.length} clientes
          </div>
        )}
      </div>
    </Layout>
  )
}