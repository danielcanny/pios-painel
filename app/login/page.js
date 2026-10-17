'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { cor, estilo } from '../../lib/tema'

const campo = { ...estilo.input, padding: '10px 14px' }
const botao = { ...estilo.botaoPrimario, width: '100%', padding: '11px', fontSize: '15px' }
const botaoVoltar = { ...estilo.botaoSecundario, width: '100%', padding: '11px' }

function IconeEnvio() {
  return (
    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: cor.primarioSuave, color: cor.primarioLink, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
      </svg>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [modo, setModo] = useState('login') // 'login' ou 'recuperar'
  const [enviado, setEnviado] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://pios-painel.vercel.app/nova-senha',
    })

    if (error) {
      setErro('Erro ao enviar e-mail. Verifique o endereco.')
      setCarregando(false)
    } else {
      setEnviado(true)
      setCarregando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: cor.fundo, padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ background: cor.card, padding: '40px', borderRadius: '16px', border: `1px solid ${cor.borda}`, boxShadow: '0 4px 24px rgba(15,23,42,0.06)', width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', background: cor.primario, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ color: cor.primarioTexto, fontWeight: '700', fontSize: '18px' }}>P</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: cor.texto, margin: 0 }}>PIOS</h1>
          <p style={{ fontSize: '13px', color: cor.textoSec, marginTop: '4px' }}>Propriedade Industrial Operacional System</p>
        </div>

        {/* Login */}
        {modo === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...estilo.label, marginBottom: '6px' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={campo} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ ...estilo.label, marginBottom: '6px' }}>Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required style={campo} />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button type="button" onClick={() => { setModo('recuperar'); setErro('') }}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: cor.primarioLink, cursor: 'pointer', fontFamily: 'inherit' }}>
                Esqueci minha senha
              </button>
            </div>

            {erro && <p style={{ color: cor.perigoTexto, fontSize: '13px', marginBottom: '12px' }}>{erro}</p>}

            <button type="submit" disabled={carregando} style={{ ...botao, opacity: carregando ? 0.6 : 1 }}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        {/* Recuperar senha */}
        {modo === 'recuperar' && !enviado && (
          <form onSubmit={handleRecuperar}>
            <p style={{ fontSize: '14px', color: cor.textoSec, marginBottom: '20px' }}>
              Digite seu e-mail e enviaremos um link para voce criar uma nova senha.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...estilo.label, marginBottom: '6px' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={campo} />
            </div>

            {erro && <p style={{ color: cor.perigoTexto, fontSize: '13px', marginBottom: '12px' }}>{erro}</p>}

            <button type="submit" disabled={carregando} style={{ ...botao, opacity: carregando ? 0.6 : 1, marginBottom: '12px' }}>
              {carregando ? 'Enviando...' : 'Enviar link de recuperacao'}
            </button>

            <button type="button" onClick={() => { setModo('login'); setErro('') }} style={botaoVoltar}>
              Voltar ao login
            </button>
          </form>
        )}

        {/* Confirmacao de envio */}
        {modo === 'recuperar' && enviado && (
          <div style={{ textAlign: 'center' }}>
            <IconeEnvio />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: cor.texto, marginBottom: '8px' }}>E-mail enviado!</h3>
            <p style={{ fontSize: '14px', color: cor.textoSec, marginBottom: '24px' }}>
              Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para criar uma nova senha.
            </p>
            <button onClick={() => { setModo('login'); setEnviado(false) }} style={botao}>
              Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
