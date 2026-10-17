// Listas de opções e funções auxiliares dos cadastros de titulares e processos.

export const ENQUADRAMENTOS = [
  { value: 'pessoa_natural', label: 'Pessoa natural' },
  { value: 'mei', label: 'MEI' },
  { value: 'me', label: 'ME' },
  { value: 'epp', label: 'EPP' },
  { value: 'outros', label: 'Outros' },
]

export const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável']

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export const SITUACOES = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
]

export const NATUREZAS = [
  { value: 'produto_servico', label: 'Produto/serviço' },
  { value: 'coletiva', label: 'Coletiva' },
  { value: 'certificacao', label: 'Certificação' },
]

export const FORMAS_APRESENTACAO = [
  { value: 'nominativa', label: 'Nominativa' },
  { value: 'figurativa', label: 'Figurativa' },
  { value: 'mista', label: 'Mista' },
  { value: 'tridimensional', label: 'Tridimensional' },
]

export const RISCOS = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'medio', label: 'Médio' },
  { value: 'alto', label: 'Alto' },
]

export const TIPOS_ESPECIFICACAO = [
  { value: 'pre_aprovada', label: 'Pré-aprovada (389)' },
  { value: 'livre', label: 'Livre preenchimento (394)' },
]

export const STATUS_OPCOES = ['Em andamento', 'Prazo vencido', 'Requer atenção', 'Arquivado', 'Concluído']

export const TIPOS_CAMPO_PERSONALIZADO = [
  { value: 'texto', label: 'Texto' },
  { value: 'texto_longo', label: 'Texto longo' },
  { value: 'numero', label: 'Número' },
  { value: 'moeda', label: 'Valor em R$' },
  { value: 'data', label: 'Data' },
  { value: 'sim_nao', label: 'Sim / Não' },
  { value: 'lista', label: 'Lista de opções' },
  { value: 'link', label: 'Link' },
]

export const rotulo = (opcoes, valor) => opcoes.find(o => o.value === valor)?.label || valor || '—'

// "Hudson Simões Ltda." -> "HUDSON-SIMOES-LTDA" (usado no nome da pasta)
export function nomeCurto(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

// Elegibilidade padrão ao desconto: tudo exceto "outros", ou hipossuficiente/PcD. O usuário pode ajustar.
export function elegivelPadrao(enquadramento, hipossuficiente) {
  return (!!enquadramento && enquadramento !== 'outros') || !!hipossuficiente
}

// PROC-{número ou PENDENTE}_{nome curto}_NCL{classe principal}
export function nomePasta({ numero, nomeCurtoMarca, classePrincipal }) {
  return `PROC-${numero || 'PENDENTE'}_${nomeCurtoMarca}_NCL${classePrincipal}`
}

let contador = 0
export const novaChave = () => `k${Date.now().toString(36)}${(contador++).toString(36)}`
