// Paleta e estilos compartilhados do PIOS (interface do software, modo claro).
// Para mudar uma cor do sistema inteiro, altere aqui.

export const cor = {
  // Menu lateral
  menu: '#121214',
  menuBorda: 'rgba(255,255,255,0.08)',
  menuTexto: '#94A3B8',
  menuTextoAtivo: '#FFFFFF',
  menuItemAtivo: 'rgba(255,255,255,0.10)',

  // Superfícies
  fundo: '#F8FAFC',
  card: '#FFFFFF',
  fundoSuave: '#F1F5F9',
  borda: '#E2E8F0',
  bordaCampo: '#CBD5E1',

  // Texto
  texto: '#334155',
  textoSec: '#64748B',
  textoClaro: '#94A3B8',

  // Ação principal (botão branco sobre azul)
  primario: '#0EA5E9',
  primarioTexto: '#FFFFFF',
  primarioLink: '#0369A1',
  primarioSuave: '#E0F2FE',

  // Semânticas
  sucesso: '#10B981',
  sucessoTexto: '#047857',
  sucessoSuave: '#D1FAE5',
  alerta: '#F59E0B',
  alertaTexto: '#B45309',
  alertaSuave: '#FEF3C7',
  perigo: '#EF4444',
  perigoTexto: '#B91C1C',
  perigoSuave: '#FEE2E2',
}

export const fonte = {
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
}

// Status do processo -> cores do selo (bg/texto) e do ponto/barra de etapa.
export const STATUS_PROCESSO = {
  'Em andamento': { bg: cor.primarioSuave, texto: cor.primarioLink, ponto: cor.primario },
  'Prazo vencido': { bg: cor.perigoSuave, texto: cor.perigoTexto, ponto: cor.perigo },
  'Requer atenção': { bg: cor.alertaSuave, texto: cor.alertaTexto, ponto: cor.alerta },
  'Concluído': { bg: cor.sucessoSuave, texto: cor.sucessoTexto, ponto: cor.sucesso },
  'Arquivado': { bg: cor.fundoSuave, texto: cor.textoSec, ponto: cor.textoClaro },
}

export const STATUS_PADRAO = STATUS_PROCESSO['Arquivado']

export const estilo = {
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: cor.texto, marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', border: `1px solid ${cor.bordaCampo}`, borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: cor.card, color: cor.texto },
  secao: { fontSize: '13px', fontWeight: '600', color: cor.texto, marginBottom: '12px', paddingBottom: '6px', borderBottom: `1px solid ${cor.borda}` },
  cartao: { background: cor.card, borderRadius: '12px', border: `1px solid ${cor.borda}` },
  botaoPrimario: { background: cor.primario, color: cor.primarioTexto, border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  botaoSecundario: { background: cor.card, color: cor.texto, border: `1px solid ${cor.borda}`, borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  th: { textAlign: 'left', padding: '10px 16px', fontWeight: '500', color: cor.textoSec, fontSize: '12px', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', verticalAlign: 'middle' },
}
