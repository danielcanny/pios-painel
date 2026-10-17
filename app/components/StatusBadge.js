import { STATUS_PROCESSO, STATUS_PADRAO } from '../../lib/tema'

export default function StatusBadge({ status, cores }) {
  const c = cores || STATUS_PROCESSO[status] || STATUS_PADRAO
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '24px', padding: '0 10px', borderRadius: '99px', background: c.bg, color: c.texto, fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.ponto }} />
      {status}
    </span>
  )
}
