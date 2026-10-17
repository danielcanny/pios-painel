import { cor } from '../../lib/tema'

export default function PageHeader({ titulo, descricao, children }) {
  return (
    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: cor.texto, margin: 0, letterSpacing: '-0.01em' }}>{titulo}</h1>
        {descricao && <p style={{ fontSize: '14px', color: cor.textoSec, margin: '4px 0 0', maxWidth: '640px' }}>{descricao}</p>}
      </div>
      {children && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>{children}</div>}
    </div>
  )
}
