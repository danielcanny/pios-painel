import { cor } from '../../lib/tema'

// Faixa do cabeçalho da página (título, descrição e ações), de ponta a ponta, com linha embaixo.
export default function PageHeader({ titulo, descricao, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${cor.borda}`, background: 'rgba(255,255,255,0.6)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: cor.texto, margin: 0, letterSpacing: '-0.01em' }}>{titulo}</h1>
        {descricao && <p style={{ fontSize: '14px', color: cor.textoSec, margin: '6px 0 0', maxWidth: '672px' }}>{descricao}</p>}
      </div>
      {children && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>{children}</div>}
    </div>
  )
}

// Área de conteúdo abaixo do cabeçalho.
export function Conteudo({ children }) {
  return <div style={{ padding: '24px' }}>{children}</div>
}
