'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { cor, estilo } from '../../lib/tema'

const campo = { ...estilo.input, padding: '10px 14px' }

export default function NovaSenha() {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      setErro('A senha deve ter no minimo 6 caracteres.')
      return
    }

    if (senha !== confirmar) {
      setErro('As senhas nao coincidem.')
      return
    }

    setCarregando(true)

    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro('Erro ao atualizar senha. Tente novamente.')
      setCarregando(false)
    } else {
      setSucesso(true)
      setCarregando(false)
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: cor.fundo, padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ background: cor.card, padding: '40px', borderRadius: '16px', border: `1px solid ${cor.borda}`, boxShadow: '0 4px 24px rgba(15,23,42,0.06)', width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', background: cor.primario, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ color: cor.primarioTexto, fontWeight: '700', fontSize: '18px' }}>P</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: cor.texto, margin: 0 }}>Nova senha</h1>
          <p style={{ fontSize: '13px', color: cor.textoSec, marginTop: '4px' }}>Digite sua nova senha abaixo</p>
        </div>

        {!sucesso ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...estilo.label, marginBottom: '6px' }}>Nova senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Min. 6 caracteres" required style={campo} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...estilo.label, marginBottom: '6px' }}>Confirmar senha</label>
              <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Repita a senha" required style={campo} />
            </div>

            {erro && <p style={{ color: cor.perigoTexto, fontSize: '13px', marginBottom: '12px' }}>{erro}</p>}

            <button type="submit" disabled={carregando}
              style={{ ...estilo.botaoPrimario, width: '100%', padding: '11px', fontSize: '15px', opacity: carregando ? 0.6 : 1 }}>
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: cor.sucessoSuave, color: cor.sucessoTexto, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: cor.texto, marginBottom: '8px' }}>Senha atualizada!</h3>
            <p style={{ fontSize: '14px', color: cor.textoSec }}>Redirecionando para o login...</p>
          </div>
        )}
      </div>
    </div>
  )
}
