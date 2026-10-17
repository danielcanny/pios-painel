import { cor } from '../../lib/tema'

export default function Avatar({ nome, tamanho = 24 }) {
  const iniciais = (nome || '?').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
  return (
    <span style={{ width: `${tamanho}px`, height: `${tamanho}px`, borderRadius: '50%', background: cor.primarioSuave, color: cor.primarioLink, fontSize: `${Math.round(tamanho * 0.42)}px`, fontWeight: '600', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {iniciais}
    </span>
  )
}
