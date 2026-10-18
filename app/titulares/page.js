'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Layout from '../components/Layout'
import PageHeader, { Conteudo } from '../components/PageHeader'
import { cor, fonte, estilo } from '../../lib/tema'
import { ENQUADRAMENTOS, rotulo } from '../../lib/campos'
import { formatarCpfCnpj, soDigitos } from '../../lib/validadores'

const normalizar = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function Titulares() {
  const [titulares, setTitulares] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const router = useRouter()

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data, error } = await supabase.from('titulares').select('*').order('created_at', { ascending: false })
      if (!ativo) return
      if (error) setErro('Não foi possível carregar os titulares: ' + error.message)
      setTitulares(data || [])
      setCarregando(false)
    }
    carregar()
    return () => { ativo = false }
  }, [router])

  async function excluir(t) {
    if (!confirm(`Excluir o titular "${t.nome_razao_social}"?`)) return
    const { error } = await supabase.from('titulares').delete().eq('id', t.id)
    if (error) {
      alert(error.code === '23503'
        ? 'Este titular está vinculado a processos ou contratos e não pode ser excluído. Para tirá-lo de uso, marque a situação como Inativo.'
        : 'Não foi possível excluir: ' + error.message)
      return
    }
    setTitulares(lista => lista.filter(x => x.id !== t.id))
  }

  const termo = normalizar(busca)
  const filtrados = titulares.filter(t => {
    if (!termo) return true
    const digitos = soDigitos(busca)
    return normalizar(`${t.nome_razao_social} ${t.nome_fantasia || ''} ${t.codigo_cliente} ${t.email_principal || ''}`).includes(termo)
      || (digitos.length > 0 && (t.cpf_cnpj || '').includes(digitos))
  })

  return (
    <Layout titulo="Titulares" botaoAcao={{ label: 'Novo titular', onClick: () => router.push('/titulares/novo') }}>
      <PageHeader titulo="Titulares" descricao="Cadastro único por CPF/CNPJ, reutilizado em todos os processos do titular.">
        <button onClick={() => router.push('/titulares/novo')} style={{ ...estilo.botaoPrimario, padding: '8px 14px' }}>+ Novo titular</button>
      </PageHeader>

      <Conteudo>
        <div style={{ ...estilo.cartao, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${cor.borda}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cor.textoClaro} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, CPF/CNPJ, código ou e-mail…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', color: cor.texto, background: 'transparent' }} />
          </div>

          {erro && <p style={{ padding: '16px', color: cor.perigoTexto, fontSize: '14px', margin: 0 }}>{erro}</p>}

          {carregando ? (
            <p style={{ padding: '24px', color: cor.textoSec, fontSize: '14px', margin: 0 }}>Carregando...</p>
          ) : filtrados.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: cor.textoSec, fontSize: '14px', margin: 0 }}>Nenhum titular encontrado.</p>
              <button onClick={() => router.push('/titulares/novo')} style={{ marginTop: '12px', color: cor.primarioLink, background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' }}>
                + Cadastrar primeiro titular
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: cor.fundo, borderBottom: `1px solid ${cor.borda}` }}>
                    <th style={estilo.th}>Código</th>
                    <th style={estilo.th}>Titular</th>
                    <th style={estilo.th}>CPF / CNPJ</th>
                    <th style={estilo.th}>Enquadramento</th>
                    <th style={estilo.th}>E-mail</th>
                    <th style={estilo.th}>Município</th>
                    <th style={estilo.th}>Situação</th>
                    <th style={estilo.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(t => (
                    <tr key={t.id} style={{ borderTop: `1px solid ${cor.borda}` }}>
                      <td style={{ ...estilo.td, fontFamily: fonte.mono, fontSize: '12px', color: cor.textoSec }}>{t.codigo_cliente}</td>
                      <td style={estilo.td}>
                        <button onClick={() => router.push(`/titulares/${t.id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                          <div style={{ fontWeight: '600', color: cor.primarioLink }}>{t.nome_razao_social}</div>
                          <div style={{ fontSize: '12px', color: cor.textoSec }}>{t.tipo_pessoa === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}{t.nome_fantasia ? ` · ${t.nome_fantasia}` : ''}</div>
                        </button>
                      </td>
                      <td style={{ ...estilo.td, fontFamily: fonte.mono, fontSize: '12px', whiteSpace: 'nowrap' }}>{t.cpf_cnpj ? formatarCpfCnpj(t.cpf_cnpj) : (t.documento_estrangeiro || '—')}</td>
                      <td style={estilo.td}>{rotulo(ENQUADRAMENTOS, t.enquadramento)}</td>
                      <td style={{ ...estilo.td, color: cor.textoSec }}>{t.email_principal}</td>
                      <td style={{ ...estilo.td, color: cor.textoSec }}>{[t.municipio, t.uf].filter(Boolean).join('/') || '—'}</td>
                      <td style={estilo.td}>
                        <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '99px', fontWeight: '500', background: t.situacao === 'ativo' ? cor.sucessoSuave : cor.fundoSuave, color: t.situacao === 'ativo' ? cor.sucessoTexto : cor.textoSec }}>
                          {t.situacao === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ ...estilo.td, textAlign: 'right' }}>
                        <button onClick={() => excluir(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cor.perigoTexto, fontSize: '13px', fontWeight: '500', fontFamily: 'inherit' }}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!carregando && filtrados.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${cor.borda}`, fontSize: '13px', color: cor.textoSec }}>
              Exibindo <strong style={{ color: cor.texto }}>{filtrados.length}</strong> de {titulares.length} titulares
            </div>
          )}
        </div>
      </Conteudo>
    </Layout>
  )
}
