import { cor } from '../../lib/tema'

const L = 600
const A = 220
const ESQ = 32
const DIR = 12
const TOPO = 12
const BASE = 28

// Curva suave (Catmull-Rom convertida em Bézier) passando pelos pontos.
function caminho(pontos) {
  if (pontos.length < 2) return ''
  let d = `M${pontos[0].x},${pontos[0].y}`
  for (let i = 0; i < pontos.length - 1; i++) {
    const p0 = pontos[i - 1] || pontos[i]
    const p1 = pontos[i]
    const p2 = pontos[i + 1]
    const p3 = pontos[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

export default function GraficoArea({ dados, corLinha = cor.primario }) {
  const maximo = Math.max(4, ...dados.map(d => d.valor))
  const passo = Math.ceil(maximo / 4)
  const topoEscala = passo * 4
  const largura = L - ESQ - DIR
  const altura = A - TOPO - BASE
  const x = i => ESQ + (dados.length === 1 ? largura / 2 : (i * largura) / (dados.length - 1))
  const y = v => TOPO + altura - (v / topoEscala) * altura
  const pontos = dados.map((d, i) => ({ x: x(i), y: y(d.valor) }))
  const linha = caminho(pontos)
  const area = pontos.length > 1 ? `${linha} L${pontos[pontos.length - 1].x},${TOPO + altura} L${pontos[0].x},${TOPO + altura} Z` : ''

  return (
    <svg viewBox={`0 0 ${L} ${A}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Depósitos por mês">
      <defs>
        <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={corLinha} stopOpacity="0.22" />
          <stop offset="100%" stopColor={corLinha} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map(i => {
        const v = i * passo
        return (
          <g key={i}>
            <line x1={ESQ} x2={L - DIR} y1={y(v)} y2={y(v)} stroke={cor.borda} strokeDasharray="3 3" />
            <text x={ESQ - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill={cor.textoSec}>{v}</text>
          </g>
        )
      })}
      {area && <path d={area} fill="url(#gradArea)" />}
      {linha && <path d={linha} fill="none" stroke={corLinha} strokeWidth="2" strokeLinecap="round" />}
      {pontos.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={cor.card} stroke={corLinha} strokeWidth="2" />)}
      {dados.map((d, i) => (
        <text key={i} x={x(i)} y={A - 8} textAnchor="middle" fontSize="10" fill={cor.textoSec}>{d.rotulo}</text>
      ))}
    </svg>
  )
}
