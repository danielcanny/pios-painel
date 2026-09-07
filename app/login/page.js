'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', background: '#0F6E56', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>P</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937', margin: 0 }}>PIOS</h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Propriedade Industrial Operacional System</p>
        </div>

        {/* Login */}
        {modo === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1f2937', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1f2937', fontFamily: 'inherit' }} />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button type="button" onClick={() => { setModo('recuperar'); setErro('') }}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: '#0F6E56', cursor: 'pointer', fontFamily: 'inherit' }}>
                Esqueci minha senha
              </button>
            </div>

            {erro && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{erro}</p>}

            <button type="submit" disabled={carregando}
              style={{ width: '100%', padding: '11px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', opacity: carregando ? 0.6 : 1, fontFamily: 'inherit' }}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        {/* Recuperar senha */}
        {modo === 'recuperar' && !enviado && (
          <form onSubmit={handleRecuperar}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              Digite seu e-mail e enviaremos um link para voce criar uma nova senha.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1f2937', fontFamily: 'inherit' }} />
            </div>

            {erro && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{erro}</p>}

            <button type="submit" disabled={carregando}
              style={{ width: '100%', padding: '11px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', opacity: carregando ? 0.6 : 1, fontFamily: 'inherit', marginBottom: '12px' }}>
              {carregando ? 'Enviando...' : 'Enviar link de recuperacao'}
            </button>

            <button type="button" onClick={() => { setModo('login'); setErro('') }}
              style={{ width: '100%', padding: '11px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Voltar ao login
            </button>
          </form>
        )}

        {/* Confirmacao de envio */}
        {modo === 'recuperar' && enviado && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>E-mail enviado!</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para criar uma nova senha.
            </p>
            <button onClick={() => { setModo('login'); setEnviado(false) }}
              style={{ width: '100%', padding: '11px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
              Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}