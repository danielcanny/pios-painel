'use client'

import { useMemo, useState } from 'react'
import { cor, estilo } from '../../lib/tema'
import { Campo } from './Campos'

const normalizar = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Busca por digitação. opcoes: [{ id, titulo, sub }]
export default function Autocomplete({ label, opcoes, valor, onSelect, placeholder = 'Buscar…', obrigatorio, erro, dica, span, limpavel }) {
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)

  const selecionado = opcoes.find(o => o.id === valor)

  const filtrados = useMemo(() => {
    const t = normalizar(termo)
    const lista = t ? opcoes.filter(o => normalizar(`${o.titulo} ${o.sub || ''}`).includes(t)) : opcoes
    return lista.slice(0, 8)
  }, [termo, opcoes])

  return (
    <Campo label={label} obrigatorio={obrigatorio} erro={erro} dica={dica} span={span}>
      <div style={{ position: 'relative' }}>
        <input
          value={aberto ? termo : (selecionado ? selecionado.titulo : '')}
          onChange={e => { setTermo(e.target.value); setAberto(true) }}
          onFocus={() => { setTermo(''); setAberto(true) }}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder={placeholder}
          style={{ ...estilo.input, borderColor: erro ? cor.perigo : cor.bordaCampo, paddingRight: limpavel && selecionado ? '32px' : '12px' }}
        />
        {limpavel && selecionado && !aberto && (
          <button type="button" aria-label="Limpar" onClick={() => onSelect(null)}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: cor.textoSec, fontSize: '16px' }}>×</button>
        )}
        {aberto && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: cor.card, border: `1px solid ${cor.borda}`, borderRadius: '8px', marginTop: '4px', maxHeight: '240px', overflowY: 'auto', zIndex: 20, boxShadow: '0 4px 12px rgba(15,23,42,0.10)' }}>
            {filtrados.length === 0 && <div style={{ padding: '10px 12px', fontSize: '13px', color: cor.textoSec }}>Nenhum resultado.</div>}
            {filtrados.map(o => (
              <div key={o.id}
                onMouseDown={() => { onSelect(o.id); setAberto(false) }}
                style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer', borderBottom: `1px solid ${cor.fundoSuave}` }}
                onMouseEnter={e => { e.currentTarget.style.background = cor.fundo }}
                onMouseLeave={e => { e.currentTarget.style.background = cor.card }}>
                <div style={{ fontWeight: '500', color: cor.texto }}>{o.titulo}</div>
                {o.sub && <div style={{ fontSize: '12px', color: cor.textoSec }}>{o.sub}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Campo>
  )
}
