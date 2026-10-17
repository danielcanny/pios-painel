'use client'

import { useState } from 'react'
import { cor, estilo } from '../../lib/tema'

// Componentes de formulário. Ficam fora das telas de propósito: definidos dentro de
// outro componente, o campo perderia o foco a cada tecla digitada.

export function Secao({ titulo, descricao, children }) {
  return (
    <section style={{ ...estilo.cartao, padding: '24px', marginBottom: '16px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: '600', color: cor.texto, margin: 0 }}>{titulo}</h2>
      {descricao && <p style={{ fontSize: '13px', color: cor.textoSec, margin: '4px 0 0' }}>{descricao}</p>}
      <div style={{ marginTop: '20px' }}>{children}</div>
    </section>
  )
}

export function Grade({ colunas = 2, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))`, gap: '16px' }}>
      {children}
    </div>
  )
}

export function Campo({ label, obrigatorio, dica, erro, span, children }) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
      {label && (
        <label style={estilo.label}>
          {label}{obrigatorio && <span style={{ color: cor.perigoTexto }}> *</span>}
        </label>
      )}
      {children}
      {erro ? (
        <p style={{ fontSize: '12px', color: cor.perigoTexto, margin: '4px 0 0' }}>{erro}</p>
      ) : dica ? (
        <p style={{ fontSize: '12px', color: cor.textoSec, margin: '4px 0 0' }}>{dica}</p>
      ) : null}
    </div>
  )
}

const estiloInput = (erro, desabilitado) => ({
  ...estilo.input,
  borderColor: erro ? cor.perigo : cor.bordaCampo,
  background: desabilitado ? cor.fundoSuave : cor.card,
  color: desabilitado ? cor.textoSec : cor.texto,
})

export function Texto({ label, value, onChange, obrigatorio, dica, erro, span, tipo = 'text', placeholder, desabilitado, mono, ...resto }) {
  return (
    <Campo label={label} obrigatorio={obrigatorio} dica={dica} erro={erro} span={span}>
      <input type={tipo} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={desabilitado}
        style={{ ...estiloInput(erro, desabilitado), fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit' }} {...resto} />
    </Campo>
  )
}

export function Area({ label, value, onChange, obrigatorio, dica, erro, span, linhas = 3, placeholder }) {
  return (
    <Campo label={label} obrigatorio={obrigatorio} dica={dica} erro={erro} span={span}>
      <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={linhas} placeholder={placeholder}
        style={{ ...estiloInput(erro), resize: 'vertical' }} />
    </Campo>
  )
}

export function Selecao({ label, value, onChange, opcoes, obrigatorio, dica, erro, span, desabilitado, placeholder = 'Selecione…' }) {
  return (
    <Campo label={label} obrigatorio={obrigatorio} dica={dica} erro={erro} span={span}>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={desabilitado} style={estiloInput(erro, desabilitado)}>
        <option value="">{placeholder}</option>
        {opcoes.map(o => {
          const valor = typeof o === 'string' ? o : o.value
          const texto = typeof o === 'string' ? o : o.label
          return <option key={valor} value={valor}>{texto}</option>
        })}
      </select>
    </Campo>
  )
}

export function SimNao({ label, value, onChange, dica, span }) {
  return (
    <Campo label={label} dica={dica} span={span}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[{ v: true, t: 'Sim' }, { v: false, t: 'Não' }].map(o => {
          const ativo = !!value === o.v
          return (
            <button key={o.t} type="button" onClick={() => onChange(o.v)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
                border: `1px solid ${ativo ? cor.primario : cor.bordaCampo}`, background: ativo ? cor.primarioSuave : cor.card, color: ativo ? cor.primarioLink : cor.texto }}>
              {o.t}
            </button>
          )
        })}
      </div>
    </Campo>
  )
}

export function Opcoes({ label, value, onChange, opcoes, span }) {
  return (
    <Campo label={label} span={span}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {opcoes.map(o => {
          const ativo = value === o.value
          return (
            <button key={o.value} type="button" onClick={() => onChange(o.value)}
              style={{ flex: 1, padding: '8px 16px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
                border: `1px solid ${ativo ? cor.primario : cor.bordaCampo}`, background: ativo ? cor.primario : cor.card, color: ativo ? cor.primarioTexto : cor.texto }}>
              {o.label}
            </button>
          )
        })}
      </div>
    </Campo>
  )
}

// Lista de itens curtos (ex.: CNAE, etiquetas): digite e pressione Enter.
export function Chips({ label, valores, onChange, placeholder, dica, span }) {
  const [texto, setTexto] = useState('')

  function adicionar() {
    const t = texto.trim()
    if (t && !valores.includes(t)) onChange([...valores, t])
    setTexto('')
  }

  return (
    <Campo label={label} dica={dica} span={span}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={texto} onChange={e => setTexto(e.target.value)} placeholder={placeholder} style={estilo.input}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }} />
        <button type="button" onClick={adicionar} style={{ ...estilo.botaoSecundario, padding: '8px 14px', whiteSpace: 'nowrap' }}>Adicionar</button>
      </div>
      {valores.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {valores.map(v => (
            <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: cor.fundoSuave, color: cor.texto, borderRadius: '99px', padding: '3px 6px 3px 10px', fontSize: '12px' }}>
              {v}
              <button type="button" aria-label={`Remover ${v}`} onClick={() => onChange(valores.filter(x => x !== v))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: cor.textoSec, fontSize: '14px', lineHeight: 1, padding: '0 2px' }}>×</button>
            </span>
          ))}
        </div>
      )}
    </Campo>
  )
}

export function Aviso({ tipo = 'info', children }) {
  const paleta = {
    info: { bg: cor.primarioSuave, texto: cor.primarioLink },
    alerta: { bg: cor.alertaSuave, texto: cor.alertaTexto },
    erro: { bg: cor.perigoSuave, texto: cor.perigoTexto },
  }[tipo]
  return <div style={{ background: paleta.bg, color: paleta.texto, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>{children}</div>
}
