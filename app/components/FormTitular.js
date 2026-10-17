'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { cor } from '../../lib/tema'
import { ENQUADRAMENTOS, ESTADOS_CIVIS, UFS, SITUACOES, nomeCurto, elegivelPadrao } from '../../lib/campos'
import { soDigitos, cpfValido, cpfCnpjValido, mascaraCpfCnpj, formatarCep, emailValido, urlValida, nuloSeVazio } from '../../lib/validadores'
import FormPagina from './FormPagina'
import Autocomplete from './Autocomplete'
import CamposPersonalizados from './CamposPersonalizados'
import { Secao, Grade, Texto, Area, Selecao, SimNao, Opcoes, Chips, Aviso } from './Campos'

const VAZIO = {
  tipo_pessoa: 'PJ', nome_razao_social: '', nome_fantasia: '', cpf_cnpj: '', domiciliado_exterior: false, documento_estrangeiro: '',
  numero_inpi: '', nome_curto_pasta: '', enquadramento: '', hipossuficiente_pcd: false, elegivel_desconto: false,
  comprovante_enquadramento_url: '', cnae: [], nacionalidade: '', estado_civil: '', profissao: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', municipio: '', uf: '', pais: 'Brasil',
  email_principal: '', email_acesso_einpi: '', telefone: '',
  representante_nome: '', representante_cpf: '', representante_cargo: '', representante_email: '',
  contratante_id: null, crm_id: '', drive_url: '', situacao: 'ativo', observacoes: '', lgpd_consentimento_em: '',
}

function paraFormulario(registro) {
  const f = {}
  for (const k of Object.keys(VAZIO)) f[k] = registro[k] ?? VAZIO[k]
  f.cpf_cnpj = mascaraCpfCnpj(f.cpf_cnpj)
  f.representante_cpf = mascaraCpfCnpj(f.representante_cpf)
  f.cep = formatarCep(f.cep)
  return f
}

function validar(f) {
  const e = {}
  const exterior = f.domiciliado_exterior
  const pj = f.tipo_pessoa === 'PJ'

  if (!f.nome_razao_social.trim()) e.nome_razao_social = pj ? 'Informe a razão social.' : 'Informe o nome completo.'

  if (!exterior) {
    const d = soDigitos(f.cpf_cnpj)
    if (!d) e.cpf_cnpj = pj ? 'Informe o CNPJ.' : 'Informe o CPF.'
    else if (!pj && d.length !== 11) e.cpf_cnpj = 'Pessoa física usa CPF (11 dígitos).'
    else if (pj && d.length !== 14) e.cpf_cnpj = 'Pessoa jurídica usa CNPJ (14 dígitos).'
    else if (!cpfCnpjValido(d)) e.cpf_cnpj = pj ? 'CNPJ inválido.' : 'CPF inválido.'
  } else if (!f.documento_estrangeiro.trim()) {
    e.documento_estrangeiro = 'Informe o documento do titular no exterior.'
  }

  if (!f.nome_curto_pasta.trim()) e.nome_curto_pasta = 'Informe o nome curto da pasta.'
  else if (!/^[A-Z0-9-]+$/.test(f.nome_curto_pasta)) e.nome_curto_pasta = 'Use só letras maiúsculas sem acento, números e hífen.'

  if (!f.enquadramento) e.enquadramento = 'Escolha o enquadramento.'
  if (f.elegivel_desconto && !f.comprovante_enquadramento_url.trim()) e.comprovante_enquadramento_url = 'Obrigatório quando elegível a desconto.'
  else if (f.comprovante_enquadramento_url.trim() && !urlValida(f.comprovante_enquadramento_url)) e.comprovante_enquadramento_url = 'Informe um link válido (https://…).'

  if (!f.logradouro.trim()) e.logradouro = 'Informe o logradouro.'
  if (!f.numero.trim()) e.numero = 'Informe o número.'
  if (!f.bairro.trim()) e.bairro = 'Informe o bairro.'
  if (!f.municipio.trim()) e.municipio = 'Informe o município.'
  if (!f.pais.trim()) e.pais = 'Informe o país.'
  if (!exterior) {
    if (soDigitos(f.cep).length !== 8) e.cep = 'Informe o CEP com 8 dígitos.'
    if (!f.uf) e.uf = 'Escolha a UF.'
  }

  if (!f.email_principal.trim()) e.email_principal = 'Informe o e-mail principal.'
  else if (!emailValido(f.email_principal)) e.email_principal = 'E-mail inválido.'
  if (f.email_acesso_einpi.trim() && !emailValido(f.email_acesso_einpi)) e.email_acesso_einpi = 'E-mail inválido.'

  if (pj) {
    if (!f.representante_nome.trim()) e.representante_nome = 'Informe o representante legal (quem assina a procuração).'
    if (!cpfValido(f.representante_cpf)) e.representante_cpf = 'Informe um CPF válido.'
    if (f.representante_email.trim() && !emailValido(f.representante_email)) e.representante_email = 'E-mail inválido.'
  }

  if (f.drive_url.trim() && !urlValida(f.drive_url)) e.drive_url = 'Informe um link válido (https://…).'
  return e
}

function montarPayload(f, extras) {
  const pj = f.tipo_pessoa === 'PJ'
  const digitos = soDigitos(f.cpf_cnpj)
  return {
    tipo_pessoa: f.tipo_pessoa,
    nome_razao_social: f.nome_razao_social.trim(),
    nome_fantasia: pj ? nuloSeVazio(f.nome_fantasia) : null,
    cpf_cnpj: digitos || null,
    domiciliado_exterior: f.domiciliado_exterior,
    documento_estrangeiro: f.domiciliado_exterior ? nuloSeVazio(f.documento_estrangeiro) : null,
    numero_inpi: nuloSeVazio(f.numero_inpi),
    nome_curto_pasta: f.nome_curto_pasta.trim(),
    enquadramento: f.enquadramento,
    hipossuficiente_pcd: f.hipossuficiente_pcd,
    elegivel_desconto: f.elegivel_desconto,
    comprovante_enquadramento_url: nuloSeVazio(f.comprovante_enquadramento_url),
    cnae: f.cnae,
    nacionalidade: pj ? null : nuloSeVazio(f.nacionalidade),
    estado_civil: pj ? null : nuloSeVazio(f.estado_civil),
    profissao: pj ? null : nuloSeVazio(f.profissao),
    cep: soDigitos(f.cep) || null,
    logradouro: nuloSeVazio(f.logradouro),
    numero: nuloSeVazio(f.numero),
    complemento: nuloSeVazio(f.complemento),
    bairro: nuloSeVazio(f.bairro),
    municipio: nuloSeVazio(f.municipio),
    uf: nuloSeVazio(f.uf),
    pais: f.pais.trim(),
    email_principal: f.email_principal.trim(),
    email_acesso_einpi: nuloSeVazio(f.email_acesso_einpi),
    telefone: nuloSeVazio(f.telefone),
    representante_nome: pj ? nuloSeVazio(f.representante_nome) : null,
    representante_cpf: pj ? (soDigitos(f.representante_cpf) || null) : null,
    representante_cargo: pj ? nuloSeVazio(f.representante_cargo) : null,
    representante_email: pj ? nuloSeVazio(f.representante_email) : null,
    contratante_id: f.contratante_id || null,
    crm_id: nuloSeVazio(f.crm_id),
    drive_url: nuloSeVazio(f.drive_url),
    situacao: f.situacao,
    observacoes: nuloSeVazio(f.observacoes),
    lgpd_consentimento_em: nuloSeVazio(f.lgpd_consentimento_em),
    campos_extras: extras,
  }
}

export default function FormTitular({ id }) {
  const editando = !!id
  const router = useRouter()
  const [f, setF] = useState(VAZIO)
  const [extras, setExtras] = useState({})
  const [errosServidor, setErrosServidor] = useState({})
  const [tentou, setTentou] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [titulares, setTitulares] = useState([])
  const [vinculado, setVinculado] = useState(false)
  const curtoManual = useRef(false)
  const elegivelManual = useRef(false)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const [lista, registro, vinculos] = await Promise.all([
        supabase.from('titulares').select('id, nome_razao_social, cpf_cnpj, codigo_cliente').order('nome_razao_social'),
        editando ? supabase.from('titulares').select('*').eq('id', id).maybeSingle() : Promise.resolve({ data: null }),
        editando ? supabase.from('processo_titulares').select('processo_id', { count: 'exact', head: true }).eq('titular_id', id) : Promise.resolve({ count: 0 }),
      ])
      if (!ativo) return

      setTitulares(lista.data || [])
      if (editando) {
        if (!registro.data) {
          setNaoEncontrado(true)
        } else {
          const form = paraFormulario(registro.data)
          curtoManual.current = true
          elegivelManual.current = form.elegivel_desconto !== elegivelPadrao(form.enquadramento, form.hipossuficiente_pcd)
          setF(form)
          setExtras(registro.data.campos_extras || {})
          setCodigo(registro.data.codigo_cliente)
          setVinculado((vinculos.count || 0) > 0)
        }
      }
      setCarregando(false)
    }
    carregar()
    return () => { ativo = false }
  }, [id, editando, router])

  function mudar(campo, valor) {
    setF(prev => {
      const novo = { ...prev, [campo]: valor }
      if (campo === 'nome_razao_social' && !curtoManual.current) novo.nome_curto_pasta = nomeCurto(valor)
      if (campo === 'tipo_pessoa' && valor === 'PF' && !prev.enquadramento) novo.enquadramento = 'pessoa_natural'
      if (['enquadramento', 'hipossuficiente_pcd', 'tipo_pessoa'].includes(campo) && !elegivelManual.current) {
        novo.elegivel_desconto = elegivelPadrao(novo.enquadramento, novo.hipossuficiente_pcd)
      }
      return novo
    })
    setErrosServidor(e => { const { [campo]: _removido, ...resto } = e; return resto })
  }

  async function aoDigitarCep(valor) {
    const formatado = formatarCep(valor)
    mudar('cep', formatado)
    const d = soDigitos(formatado)
    if (d.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`)
      const dados = await res.json()
      if (dados.erro) return
      setF(prev => ({
        ...prev,
        logradouro: dados.logradouro || prev.logradouro,
        bairro: dados.bairro || prev.bairro,
        municipio: dados.localidade || prev.municipio,
        uf: dados.uf || prev.uf,
      }))
    } catch {
      // sem internet ou serviço fora do ar: o usuário preenche à mão
    }
  }

  async function salvar() {
    setTentou(true)
    setMensagemErro('')
    if (Object.keys(validar(f)).length > 0) return

    setSalvando(true)
    const payload = montarPayload(f, extras)
    const consulta = editando
      ? supabase.from('titulares').update(payload).eq('id', id)
      : supabase.from('titulares').insert([payload])
    const { error } = await consulta.select('id').single()
    setSalvando(false)

    if (error) {
      if (error.code === '23505' && error.message.includes('cpf_cnpj')) {
        setErrosServidor({ cpf_cnpj: 'Já existe um titular cadastrado com este CPF/CNPJ.' })
      } else {
        setMensagemErro('Não foi possível salvar: ' + error.message)
      }
      return
    }
    router.push('/titulares')
  }

  const pj = f.tipo_pessoa === 'PJ'
  const exterior = f.domiciliado_exterior
  const erros = { ...(tentou ? validar(f) : {}), ...errosServidor }
  const listaErros = [...Object.values(erros).filter(Boolean), ...(mensagemErro ? [mensagemErro] : [])]
  const opcoesContratante = titulares.filter(t => t.id !== id).map(t => ({ id: t.id, titulo: t.nome_razao_social, sub: `${t.codigo_cliente}${t.cpf_cnpj ? ' · ' + mascaraCpfCnpj(t.cpf_cnpj) : ''}` }))

  if (naoEncontrado) {
    return (
      <FormPagina rotulo="Titulares" titulo="Titular não encontrado" voltarHref="/titulares" voltarTexto="Voltar para titulares" onCancelar={() => router.push('/titulares')} onSalvar={() => {}}>
        <Aviso tipo="alerta">Este titular não existe ou foi excluído.</Aviso>
      </FormPagina>
    )
  }

  return (
    <FormPagina
      rotulo="Titulares"
      titulo={editando ? (f.nome_razao_social || 'Titular') : 'Novo titular'}
      descricao={editando ? 'Cadastro único, reutilizado em todos os processos deste titular.' : 'Cadastro único por CPF/CNPJ, reutilizado em todos os processos do titular.'}
      selo={codigo && <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '12px', background: cor.fundoSuave, border: `1px solid ${cor.borda}`, borderRadius: '99px', padding: '2px 10px', color: cor.textoSec }}>{codigo}</span>}
      voltarHref="/titulares"
      voltarTexto="Voltar para titulares"
      onCancelar={() => router.push('/titulares')}
      onSalvar={salvar}
      salvando={salvando}
      carregando={carregando}
      erros={listaErros}
      textoSalvar={editando ? 'Salvar alterações' : 'Cadastrar titular'}
    >
      <Secao titulo="Identificação">
        <Grade>
          <Opcoes label="Tipo de pessoa" span={2} value={f.tipo_pessoa} onChange={v => mudar('tipo_pessoa', v)}
            opcoes={[{ value: 'PJ', label: 'Pessoa jurídica' }, { value: 'PF', label: 'Pessoa física' }]} />
          <Texto label={pj ? 'Razão social' : 'Nome completo'} obrigatorio span={2} value={f.nome_razao_social} onChange={v => mudar('nome_razao_social', v)}
            erro={erros.nome_razao_social} dica="Igual ao cadastro no INPI." />
          {pj && <Texto label="Nome fantasia" value={f.nome_fantasia} onChange={v => mudar('nome_fantasia', v)} />}
          <SimNao label="Domiciliado no exterior" value={f.domiciliado_exterior} onChange={v => mudar('domiciliado_exterior', v)}
            dica="Habilita país e documento estrangeiro no lugar de CPF/CNPJ." />
          {!exterior ? (
            <Texto label={pj ? 'CNPJ' : 'CPF'} obrigatorio value={f.cpf_cnpj} onChange={v => mudar('cpf_cnpj', mascaraCpfCnpj(v))}
              erro={erros.cpf_cnpj} desabilitado={vinculado} placeholder={pj ? '00.000.000/0000-00' : '000.000.000-00'} mono
              dica={vinculado ? 'Bloqueado: titular vinculado a processos. No INPI, trocar o número gera um novo cadastro.' : undefined} />
          ) : (
            <Texto label="Documento estrangeiro" obrigatorio value={f.documento_estrangeiro} onChange={v => mudar('documento_estrangeiro', v)} erro={erros.documento_estrangeiro} />
          )}
          <Texto label="Número INPI" value={f.numero_inpi} onChange={v => mudar('numero_inpi', v)} dica="Cadastro no e-INPI." />
          <Texto label="Nome curto da pasta" obrigatorio value={f.nome_curto_pasta} mono
            onChange={v => { curtoManual.current = true; mudar('nome_curto_pasta', v.toUpperCase().replace(/[^A-Z0-9-]/g, '')) }}
            erro={erros.nome_curto_pasta} dica="Ex.: HUDSON-SIMOES, sem acento. Usado no nome da pasta." />
          {!pj && (
            <>
              <Texto label="Nacionalidade" value={f.nacionalidade} onChange={v => mudar('nacionalidade', v)} />
              <Selecao label="Estado civil" value={f.estado_civil} onChange={v => mudar('estado_civil', v)} opcoes={ESTADOS_CIVIS} />
              <Texto label="Profissão" value={f.profissao} onChange={v => mudar('profissao', v)} />
            </>
          )}
        </Grade>
      </Secao>

      <Secao titulo="Enquadramento e desconto" descricao="Base do desconto na Tabela de Retribuições do INPI.">
        <Grade>
          <Selecao label="Enquadramento" obrigatorio value={f.enquadramento} onChange={v => mudar('enquadramento', v)} opcoes={ENQUADRAMENTOS} erro={erros.enquadramento} />
          <SimNao label="Hipossuficiente / PcD" value={f.hipossuficiente_pcd} onChange={v => mudar('hipossuficiente_pcd', v)} dica="Regime próprio de desconto na tabela." />
          <SimNao label="Elegível a desconto" value={f.elegivel_desconto} onChange={v => { elegivelManual.current = true; mudar('elegivel_desconto', v) }}
            dica="Calculado pelo enquadramento. Você pode ajustar manualmente." />
          <Texto label="Comprovante do enquadramento (link)" obrigatorio={f.elegivel_desconto} tipo="url" placeholder="https://" value={f.comprovante_enquadramento_url}
            onChange={v => mudar('comprovante_enquadramento_url', v)} erro={erros.comprovante_enquadramento_url} />
          <Chips label="CNAE principal e secundários" span={2} valores={f.cnae} onChange={v => mudar('cnae', v)}
            placeholder="Digite o código e pressione Enter" dica="Apoia a declaração de atividade (art. 128 da LPI). O principal primeiro." />
        </Grade>
      </Secao>

      <Secao titulo="Endereço" descricao="Igual ao do INPI.">
        <Grade>
          {!exterior && <Texto label="CEP" obrigatorio value={f.cep} onChange={aoDigitarCep} erro={erros.cep} placeholder="00000-000" />}
          <Texto label="Logradouro" obrigatorio span={exterior ? 2 : 1} value={f.logradouro} onChange={v => mudar('logradouro', v)} erro={erros.logradouro} />
          <Texto label="Número" obrigatorio value={f.numero} onChange={v => mudar('numero', v)} erro={erros.numero} />
          <Texto label="Complemento" value={f.complemento} onChange={v => mudar('complemento', v)} />
          <Texto label="Bairro" obrigatorio value={f.bairro} onChange={v => mudar('bairro', v)} erro={erros.bairro} />
          <Texto label="Município" obrigatorio value={f.municipio} onChange={v => mudar('municipio', v)} erro={erros.municipio} />
          {!exterior && <Selecao label="UF" obrigatorio value={f.uf} onChange={v => mudar('uf', v)} opcoes={UFS} erro={erros.uf} />}
          <Texto label="País" obrigatorio value={f.pais} onChange={v => mudar('pais', v)} erro={erros.pais} />
        </Grade>
      </Secao>

      <Secao titulo="Contato">
        <Grade>
          <Texto label="E-mail principal" obrigatorio tipo="email" value={f.email_principal} onChange={v => mudar('email_principal', v)} erro={erros.email_principal} />
          <Texto label="E-mail de acesso ao e-INPI" tipo="email" value={f.email_acesso_einpi} onChange={v => mudar('email_acesso_einpi', v)}
            erro={erros.email_acesso_einpi} dica="Se você usa um por cliente. Não guarde senhas aqui." />
          <Texto label="Telefone / WhatsApp" value={f.telefone} onChange={v => mudar('telefone', v)} placeholder="(00) 00000-0000" />
        </Grade>
      </Secao>

      {pj && (
        <Secao titulo="Representante legal" descricao="Quem assina a procuração.">
          <Grade>
            <Texto label="Nome" obrigatorio value={f.representante_nome} onChange={v => mudar('representante_nome', v)} erro={erros.representante_nome} />
            <Texto label="CPF" obrigatorio value={f.representante_cpf} onChange={v => mudar('representante_cpf', mascaraCpfCnpj(v))} erro={erros.representante_cpf} placeholder="000.000.000-00" mono />
            <Texto label="Cargo" value={f.representante_cargo} onChange={v => mudar('representante_cargo', v)} />
            <Texto label="E-mail" tipo="email" value={f.representante_email} onChange={v => mudar('representante_email', v)} erro={erros.representante_email} />
          </Grade>
        </Secao>
      )}

      <Secao titulo="Operação">
        <Grade>
          <Autocomplete label="Contratante responsável" opcoes={opcoesContratante} valor={f.contratante_id} limpavel
            onSelect={v => mudar('contratante_id', v)} placeholder="Buscar titular…" dica="Só se quem contrata não for o próprio titular." />
          <Selecao label="Situação" value={f.situacao} onChange={v => mudar('situacao', v)} opcoes={SITUACOES} />
          <Texto label="ID no CRM" value={f.crm_id} onChange={v => mudar('crm_id', v)} dica="Para sincronizar." />
          <Texto label="Link da pasta no Drive" tipo="url" placeholder="https://" value={f.drive_url} onChange={v => mudar('drive_url', v)} erro={erros.drive_url} />
          <Texto label="Consentimento LGPD em" tipo="date" value={f.lgpd_consentimento_em} onChange={v => mudar('lgpd_consentimento_em', v)} dica="Data do consentimento para o tratamento dos dados." />
          <Area label="Observações" span={2} value={f.observacoes} onChange={v => mudar('observacoes', v)} />
        </Grade>
      </Secao>

      <CamposPersonalizados entidade="titular" valores={extras} onChange={setExtras} />
    </FormPagina>
  )
}
