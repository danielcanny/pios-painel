'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { cor, fonte, estilo } from '../../lib/tema'
import { NATUREZAS, FORMAS_APRESENTACAO, RISCOS, TIPOS_ESPECIFICACAO, STATUS_OPCOES, nomeCurto, nomePasta, novaChave } from '../../lib/campos'
import { mascaraCpfCnpj, urlValida, nuloSeVazio, numeroProcessoValido } from '../../lib/validadores'
import FormPagina from './FormPagina'
import Autocomplete from './Autocomplete'
import CamposPersonalizados from './CamposPersonalizados'
import { Secao, Grade, Campo, Texto, Area, Selecao, SimNao, Chips, Aviso } from './Campos'

const VAZIO = {
  numero_processo: '', grupo_familia: '', processo_origem_id: null, responsavel_id: '',
  natureza: '', forma_apresentacao: '', marca: '', nome_curto: '', arquivo_marca_url: '',
  viabilidade_data: '', viabilidade_risco: '', viabilidade_parecer_url: '',
  status: 'Em andamento', prazo: '',
  drive_url: '', crm_id: '', etiquetas: [], observacoes: '',
}

const novoTitular = (principal) => ({
  chave: novaChave(), titular_id: null, principal, participacao_pct: '',
  declaracao_atividade: false, declaracao_atividade_data: '',
  procuracao_assinada: false, procuracao_data: '', procuracao_url: '',
})

const novaClasse = (principal) => ({
  chave: novaChave(), classe_ncl: '', tipo_especificacao: 'pre_aprovada', especificacao: '', classe_principal: principal,
})

function paraFormulario(p) {
  const f = {}
  for (const k of Object.keys(VAZIO)) f[k] = p[k] ?? VAZIO[k]
  return f
}

function validar(f, titulares, classes) {
  const e = {}
  const listaTitulares = []
  const listaClasses = []

  if (!f.marca.trim()) e.marca = 'Informe o elemento nominativo.'
  if (!f.nome_curto.trim()) e.nome_curto = 'Informe o nome curto.'
  else if (!/^[A-Z0-9-]+$/.test(f.nome_curto)) e.nome_curto = 'Use só letras maiúsculas sem acento, números e hífen.'
  if (!f.natureza) e.natureza = 'Escolha a natureza.'
  if (!f.forma_apresentacao) e.forma_apresentacao = 'Escolha a forma de apresentação.'
  if (['figurativa', 'mista'].includes(f.forma_apresentacao) && !f.arquivo_marca_url.trim()) e.arquivo_marca_url = 'Obrigatório para marca figurativa ou mista.'
  if (f.numero_processo && !numeroProcessoValido(f.numero_processo)) e.numero_processo = 'O número do processo tem 9 dígitos.'
  for (const campo of ['arquivo_marca_url', 'viabilidade_parecer_url', 'drive_url']) {
    if (f[campo].trim() && !urlValida(f[campo])) e[campo] = 'Informe um link válido (https://…).'
  }

  if (titulares.length === 0) listaTitulares.push('Inclua pelo menos um titular.')
  const vistos = new Set()
  for (const t of titulares) {
    if (!t.titular_id) e[`t:${t.chave}`] = 'Escolha o titular.'
    else if (vistos.has(t.titular_id)) e[`t:${t.chave}`] = 'Este titular já foi incluído.'
    vistos.add(t.titular_id)
    if (t.participacao_pct !== '' && (Number(t.participacao_pct) < 0 || Number(t.participacao_pct) > 100)) e[`p:${t.chave}`] = 'Entre 0 e 100.'
    if (t.procuracao_url.trim() && !urlValida(t.procuracao_url)) e[`u:${t.chave}`] = 'Link inválido.'
  }
  if (titulares.length > 0 && titulares.filter(t => t.principal).length !== 1) listaTitulares.push('Defina um, e apenas um, titular principal.')

  if (classes.length === 0) listaClasses.push('Inclua pelo menos uma classe.')
  const ncls = new Set()
  for (const c of classes) {
    const n = Number(c.classe_ncl)
    if (!Number.isInteger(n) || n < 1 || n > 45) e[`c:${c.chave}:ncl`] = 'Classe de 1 a 45.'
    else if (ncls.has(n)) e[`c:${c.chave}:ncl`] = 'Classe repetida.'
    ncls.add(n)
    if (!c.especificacao.trim()) e[`c:${c.chave}:esp`] = 'Informe a especificação.'
  }
  if (classes.length > 0 && classes.filter(c => c.classe_principal).length !== 1) listaClasses.push('Defina uma, e apenas uma, classe principal.')

  return { e, listaTitulares, listaClasses }
}

function BotaoPrincipal({ ativo, onClick, texto, textoAtivo }) {
  return (
    <button type="button" onClick={onClick}
      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
        border: `1px solid ${ativo ? cor.primario : cor.bordaCampo}`, background: ativo ? cor.primarioSuave : cor.card, color: ativo ? cor.primarioLink : cor.texto }}>
      {ativo ? textoAtivo : texto}
    </button>
  )
}

function CartaoLinha({ children, onRemover, textoRemover }) {
  return (
    <div style={{ border: `1px solid ${cor.borda}`, borderRadius: '10px', padding: '16px', marginBottom: '12px', background: cor.fundo }}>
      {children}
      {onRemover && (
        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <button type="button" onClick={onRemover} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cor.perigoTexto, fontSize: '13px', fontWeight: '500', fontFamily: 'inherit' }}>
            {textoRemover}
          </button>
        </div>
      )}
    </div>
  )
}

export default function FormProcesso({ id }) {
  const editando = !!id
  const router = useRouter()
  const [f, setF] = useState(VAZIO)
  const [titulares, setTitulares] = useState([novoTitular(true)])
  const [classes, setClasses] = useState([novaClasse(true)])
  const [extras, setExtras] = useState({})
  const [errosServidor, setErrosServidor] = useState({})
  const [tentou, setTentou] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [catalogoTitulares, setCatalogoTitulares] = useState([])
  const [perfis, setPerfis] = useState([])
  const [etapas, setEtapas] = useState([])
  const [outrosProcessos, setOutrosProcessos] = useState([])
  const curtoManual = useRef(false)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const [tRes, pRes, eRes, procRes, regRes, vincRes, clRes] = await Promise.all([
        supabase.from('titulares').select('id, nome_razao_social, cpf_cnpj, codigo_cliente, elegivel_desconto').order('nome_razao_social'),
        supabase.from('perfis').select('id, nome, email'),
        supabase.from('etapas_processo').select('*').order('ordem'),
        supabase.from('processos').select('id, marca, numero_processo').order('created_at', { ascending: false }),
        editando ? supabase.from('processos').select('*').eq('id', id).maybeSingle() : Promise.resolve({ data: null }),
        editando ? supabase.from('processo_titulares').select('*').eq('processo_id', id) : Promise.resolve({ data: [] }),
        editando ? supabase.from('processo_classes').select('*').eq('processo_id', id).order('classe_ncl') : Promise.resolve({ data: [] }),
      ])
      if (!ativo) return

      setCatalogoTitulares(tRes.data || [])
      setPerfis(pRes.data || [])
      setEtapas(eRes.data || [])
      setOutrosProcessos((procRes.data || []).filter(p => p.id !== id))

      if (editando) {
        if (!regRes.data) {
          setNaoEncontrado(true)
        } else {
          curtoManual.current = true
          setF(paraFormulario(regRes.data))
          setExtras(regRes.data.campos_extras || {})
          const linhasT = (vincRes.data || []).map(t => ({
            chave: novaChave(), titular_id: t.titular_id, principal: t.principal, participacao_pct: t.participacao_pct ?? '',
            declaracao_atividade: t.declaracao_atividade, declaracao_atividade_data: t.declaracao_atividade_data || '',
            procuracao_assinada: t.procuracao_assinada, procuracao_data: t.procuracao_data || '', procuracao_url: t.procuracao_url || '',
          }))
          const linhasC = (clRes.data || []).map(c => ({
            chave: novaChave(), classe_ncl: c.classe_ncl, tipo_especificacao: c.tipo_especificacao, especificacao: c.especificacao, classe_principal: c.classe_principal,
          }))
          if (linhasT.length) setTitulares(linhasT)
          if (linhasC.length) setClasses(linhasC)
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
      if (campo === 'marca' && !curtoManual.current) novo.nome_curto = nomeCurto(valor)
      return novo
    })
    setErrosServidor(e => { const { [campo]: _removido, ...resto } = e; return resto })
  }

  const atualizarTitular = (chave, patch) => setTitulares(ts => ts.map(t => t.chave === chave ? { ...t, ...patch } : t))
  const definirTitularPrincipal = (chave) => setTitulares(ts => ts.map(t => ({ ...t, principal: t.chave === chave })))
  const removerTitular = (chave) => setTitulares(ts => {
    const resto = ts.filter(t => t.chave !== chave)
    if (resto.length > 0 && !resto.some(t => t.principal)) resto[0] = { ...resto[0], principal: true }
    return resto
  })

  const atualizarClasse = (chave, patch) => setClasses(cs => cs.map(c => c.chave === chave ? { ...c, ...patch } : c))
  const definirClassePrincipal = (chave) => setClasses(cs => cs.map(c => ({ ...c, classe_principal: c.chave === chave })))
  const removerClasse = (chave) => setClasses(cs => {
    const resto = cs.filter(c => c.chave !== chave)
    if (resto.length > 0 && !resto.some(c => c.classe_principal)) resto[0] = { ...resto[0], classe_principal: true }
    return resto
  })

  async function salvar() {
    setTentou(true)
    setMensagemErro('')
    const { e, listaTitulares, listaClasses } = validar(f, titulares, classes)
    if (Object.keys(e).length > 0 || listaTitulares.length > 0 || listaClasses.length > 0) return

    setSalvando(true)
    const classePrincipal = classes.find(c => c.classe_principal)
    const payload = {
      numero_processo: f.numero_processo || null,
      grupo_familia: nuloSeVazio(f.grupo_familia),
      processo_origem_id: f.processo_origem_id || null,
      responsavel_id: f.responsavel_id || null,
      natureza: f.natureza,
      forma_apresentacao: f.forma_apresentacao,
      marca: f.marca.trim(),
      nome_curto: f.nome_curto.trim(),
      arquivo_marca_url: nuloSeVazio(f.arquivo_marca_url),
      viabilidade_data: nuloSeVazio(f.viabilidade_data),
      viabilidade_risco: nuloSeVazio(f.viabilidade_risco),
      viabilidade_parecer_url: nuloSeVazio(f.viabilidade_parecer_url),
      status: f.status,
      prazo: nuloSeVazio(f.prazo),
      drive_url: nuloSeVazio(f.drive_url),
      crm_id: nuloSeVazio(f.crm_id),
      etiquetas: f.etiquetas,
      observacoes: nuloSeVazio(f.observacoes),
      nome_pasta: nomePasta({ numero: f.numero_processo, nomeCurtoMarca: f.nome_curto.trim(), classePrincipal: Number(classePrincipal.classe_ncl) }),
      campos_extras: extras,
    }

    const linhasTitulares = (processoId) => titulares.map(t => ({
      processo_id: processoId, titular_id: t.titular_id, principal: t.principal,
      participacao_pct: t.participacao_pct === '' ? null : Number(t.participacao_pct),
      declaracao_atividade: t.declaracao_atividade, declaracao_atividade_data: nuloSeVazio(t.declaracao_atividade_data),
      procuracao_assinada: t.procuracao_assinada, procuracao_data: nuloSeVazio(t.procuracao_data), procuracao_url: nuloSeVazio(t.procuracao_url),
    }))
    const linhasClasses = (processoId) => classes.map(c => ({
      processo_id: processoId, classe_ncl: Number(c.classe_ncl), tipo_especificacao: c.tipo_especificacao,
      especificacao: c.especificacao.trim(), classe_principal: c.classe_principal,
    }))

    function falha(error) {
      setSalvando(false)
      if (error.code === '23505' && error.message.includes('processos_numero_unico')) {
        setErrosServidor({ numero_processo: 'Já existe um processo com este número.' })
      } else {
        setMensagemErro('Não foi possível salvar: ' + error.message)
      }
    }

    if (!editando) {
      const etapaInicial = etapas.find(et => et.ordem === 1)
      const { data: criado, error } = await supabase.from('processos')
        .insert([{ ...payload, etapa_id: etapaInicial ? etapaInicial.id : null }]).select('id').single()
      if (error) return falha(error)

      const rT = await supabase.from('processo_titulares').insert(linhasTitulares(criado.id))
      const rC = rT.error ? null : await supabase.from('processo_classes').insert(linhasClasses(criado.id))
      const erroFilhos = rT.error || rC?.error
      if (erroFilhos) {
        await supabase.from('processos').delete().eq('id', criado.id)
        return falha(erroFilhos)
      }
    } else {
      const { error } = await supabase.from('processos').update(payload).eq('id', id)
      if (error) return falha(error)

      // zera o principal antes, para a troca de titular principal não bater no índice de "um só principal"
      const r0 = await supabase.from('processo_titulares').update({ principal: false }).eq('processo_id', id)
      if (r0.error) return falha(r0.error)
      const rU = await supabase.from('processo_titulares').upsert(linhasTitulares(id), { onConflict: 'processo_id,titular_id' })
      if (rU.error) return falha(rU.error)
      const idsMantidos = titulares.map(t => t.titular_id).join(',')
      const rD = await supabase.from('processo_titulares').delete().eq('processo_id', id).not('titular_id', 'in', `(${idsMantidos})`)
      if (rD.error) return falha(rD.error)

      const rX = await supabase.from('processo_classes').delete().eq('processo_id', id)
      if (rX.error) return falha(rX.error)
      const rC = await supabase.from('processo_classes').insert(linhasClasses(id))
      if (rC.error) return falha(rC.error)
    }

    setSalvando(false)
    router.push('/processos')
  }

  const opcoesTitulares = catalogoTitulares.map(t => ({ id: t.id, titulo: t.nome_razao_social, sub: `${t.codigo_cliente}${t.cpf_cnpj ? ' · ' + mascaraCpfCnpj(t.cpf_cnpj) : ''}` }))
  const opcoesProcessos = outrosProcessos.map(p => ({ id: p.id, titulo: p.marca || 'Sem marca', sub: p.numero_processo || 'Sem número' }))
  const opcoesPerfis = perfis.map(p => ({ value: p.id, label: p.nome || p.email }))
  const escolhidos = titulares.map(t => catalogoTitulares.find(c => c.id === t.titular_id)).filter(Boolean)
  const algumNaoElegivel = escolhidos.some(t => !t.elegivel_desconto)
  const classePrincipal = classes.find(c => c.classe_principal)
  const nomePastaGerado = f.nome_curto && classePrincipal?.classe_ncl
    ? nomePasta({ numero: f.numero_processo, nomeCurtoMarca: f.nome_curto, classePrincipal: classePrincipal.classe_ncl }) : ''
  const validacao = tentou ? validar(f, titulares, classes) : { e: {}, listaTitulares: [], listaClasses: [] }
  const erros = { ...validacao.e, ...errosServidor }
  const errosListas = { titulares: validacao.listaTitulares, classes: validacao.listaClasses }
  const listaErros = [...Object.values(erros).filter(Boolean), ...errosListas.titulares, ...errosListas.classes, ...(mensagemErro ? [mensagemErro] : [])]

  if (naoEncontrado) {
    return (
      <FormPagina rotulo="Processos" titulo="Processo não encontrado" voltarHref="/processos" voltarTexto="Voltar para processos" onCancelar={() => router.push('/processos')} onSalvar={() => {}}>
        <Aviso tipo="alerta">Este processo não existe ou foi excluído.</Aviso>
      </FormPagina>
    )
  }

  return (
    <FormPagina
      rotulo="Processos"
      titulo={editando ? (f.marca || 'Processo') : 'Novo processo'}
      descricao={editando ? 'Dados do pedido, titulares e classes.' : 'Cadastre o pedido, os titulares e as classes. Ele entra na primeira etapa do fluxo (Depósito).'}
      selo={f.numero_processo && <span style={{ fontFamily: fonte.mono, fontSize: '12px', background: cor.fundoSuave, border: `1px solid ${cor.borda}`, borderRadius: '99px', padding: '2px 10px', color: cor.textoSec }}>{f.numero_processo}</span>}
      voltarHref="/processos"
      voltarTexto="Voltar para processos"
      onCancelar={() => router.push('/processos')}
      onSalvar={salvar}
      salvando={salvando}
      carregando={carregando}
      erros={listaErros}
      textoSalvar={editando ? 'Salvar alterações' : 'Cadastrar processo'}
    >
      <Secao titulo="Identificação">
        <Grade>
          <Texto label="Número do processo INPI" value={f.numero_processo} mono
            onChange={v => mudar('numero_processo', v.replace(/\D/g, '').slice(0, 9))} erro={erros.numero_processo}
            placeholder="9 dígitos" dica="Vazio até o depósito. Único quando preenchido." />
          <Campo label="Situação do número">
            <div style={{ ...estilo.input, background: cor.fundoSuave, color: cor.textoSec }}>{f.numero_processo ? 'Depositado' : 'Pendente'}</div>
          </Campo>
          <Texto label="Grupo / família" value={f.grupo_familia} onChange={v => mudar('grupo_familia', v)} dica="Ex.: as classes de DENATURE." />
          <Autocomplete label="Processo de origem" opcoes={opcoesProcessos} valor={f.processo_origem_id} limpavel
            onSelect={v => mudar('processo_origem_id', v)} placeholder="Buscar processo…" dica="Reapresentação, divisão ou novo pedido." />
          <Selecao label="Responsável interno" value={f.responsavel_id} onChange={v => mudar('responsavel_id', v)} opcoes={opcoesPerfis} />
        </Grade>
      </Secao>

      <Secao titulo="Marca">
        <Grade>
          <Selecao label="Natureza" obrigatorio value={f.natureza} onChange={v => mudar('natureza', v)} opcoes={NATUREZAS} erro={erros.natureza} />
          <Selecao label="Forma de apresentação" obrigatorio value={f.forma_apresentacao} onChange={v => mudar('forma_apresentacao', v)} opcoes={FORMAS_APRESENTACAO} erro={erros.forma_apresentacao} />
          <Texto label="Elemento nominativo" obrigatorio value={f.marca} onChange={v => mudar('marca', v)} erro={erros.marca} dica="Como depositado no INPI." />
          <Texto label="Nome curto" obrigatorio value={f.nome_curto} mono
            onChange={v => { curtoManual.current = true; mudar('nome_curto', v.toUpperCase().replace(/[^A-Z0-9-]/g, '')) }}
            erro={erros.nome_curto} dica="Para a pasta, ex.: DAMI-STORE." />
          <Texto label="Arquivo da marca (link)" obrigatorio={['figurativa', 'mista'].includes(f.forma_apresentacao)} span={2} tipo="url" placeholder="https://"
            value={f.arquivo_marca_url} onChange={v => mudar('arquivo_marca_url', v)} erro={erros.arquivo_marca_url} dica="Para marca figurativa e mista." />
          <Texto label="Viabilidade: data" tipo="date" value={f.viabilidade_data} onChange={v => mudar('viabilidade_data', v)} />
          <Selecao label="Viabilidade: risco" value={f.viabilidade_risco} onChange={v => mudar('viabilidade_risco', v)} opcoes={RISCOS} />
          <Texto label="Viabilidade: link do parecer" span={2} tipo="url" placeholder="https://" value={f.viabilidade_parecer_url}
            onChange={v => mudar('viabilidade_parecer_url', v)} erro={erros.viabilidade_parecer_url} />
        </Grade>
      </Secao>

      <Secao titulo="Titulares" descricao="Mínimo de um. Um só principal, que é quem emite a GRU. Mais de um titular configura cotitularidade.">
        {errosListas.titulares.map((m, i) => <Aviso key={i} tipo="erro">{m}</Aviso>)}
        {titulares.length > 1 && (
          <Aviso tipo={algumNaoElegivel ? 'alerta' : 'info'}>
            Cotitularidade: o desconto só vale se todos os titulares forem elegíveis.{' '}
            {escolhidos.length === titulares.length && (algumNaoElegivel ? 'Há titular não elegível: sem desconto neste processo.' : 'Todos os titulares escolhidos são elegíveis.')}
          </Aviso>
        )}
        {titulares.map(t => (
          <CartaoLinha key={t.chave} onRemover={titulares.length > 1 ? () => removerTitular(t.chave) : null} textoRemover="Remover titular">
            <Grade colunas={3}>
              <Autocomplete label="Titular" obrigatorio span={2} opcoes={opcoesTitulares} valor={t.titular_id} placeholder="Buscar titular…"
                onSelect={v => atualizarTitular(t.chave, { titular_id: v })} erro={erros[`t:${t.chave}`]} />
              <Campo label="Titular principal">
                <BotaoPrincipal ativo={t.principal} onClick={() => definirTitularPrincipal(t.chave)} texto="Definir como principal" textoAtivo="✓ Principal" />
              </Campo>
              <Texto label="Participação (%)" tipo="number" min="0" max="100" step="0.01" value={t.participacao_pct}
                onChange={v => atualizarTitular(t.chave, { participacao_pct: v })} erro={erros[`p:${t.chave}`]} dica="Uso interno. O INPI não registra." />
              <SimNao label="Declaração de atividade" value={t.declaracao_atividade} onChange={v => atualizarTitular(t.chave, { declaracao_atividade: v })} />
              <Texto label="Data da declaração" tipo="date" value={t.declaracao_atividade_data} onChange={v => atualizarTitular(t.chave, { declaracao_atividade_data: v })} />
              <SimNao label="Procuração assinada" value={t.procuracao_assinada} onChange={v => atualizarTitular(t.chave, { procuracao_assinada: v })} />
              <Texto label="Data da procuração" tipo="date" value={t.procuracao_data} onChange={v => atualizarTitular(t.chave, { procuracao_data: v })} />
              <Texto label="Link da procuração" tipo="url" placeholder="https://" value={t.procuracao_url}
                onChange={v => atualizarTitular(t.chave, { procuracao_url: v })} erro={erros[`u:${t.chave}`]} />
            </Grade>
          </CartaoLinha>
        ))}
        <button type="button" onClick={() => setTitulares(ts => [...ts, novoTitular(false)])} style={{ ...estilo.botaoSecundario, padding: '8px 14px' }}>+ Adicionar titular</button>
      </Secao>

      <Secao titulo="Classes" descricao="Uma linha por classe do pedido. Uma só é a principal e entra no nome da pasta.">
        {errosListas.classes.map((m, i) => <Aviso key={i} tipo="erro">{m}</Aviso>)}
        {classes.map(c => (
          <CartaoLinha key={c.chave} onRemover={classes.length > 1 ? () => removerClasse(c.chave) : null} textoRemover="Remover classe">
            <Grade colunas={3}>
              <Texto label="Classe NCL" obrigatorio tipo="number" min="1" max="45" value={c.classe_ncl}
                onChange={v => atualizarClasse(c.chave, { classe_ncl: v })} erro={erros[`c:${c.chave}:ncl`]} placeholder="1 a 45" />
              <Selecao label="Tipo de especificação" obrigatorio value={c.tipo_especificacao} onChange={v => atualizarClasse(c.chave, { tipo_especificacao: v })}
                opcoes={TIPOS_ESPECIFICACAO} dica="Define o código do serviço da GRU." />
              <Campo label="Classe principal">
                <BotaoPrincipal ativo={c.classe_principal} onClick={() => definirClassePrincipal(c.chave)} texto="Definir como principal" textoAtivo="✓ Principal" />
              </Campo>
              <Area label="Especificação" obrigatorio span={3} linhas={2} value={c.especificacao}
                onChange={v => atualizarClasse(c.chave, { especificacao: v })} erro={erros[`c:${c.chave}:esp`]} />
            </Grade>
          </CartaoLinha>
        ))}
        <button type="button" onClick={() => setClasses(cs => [...cs, novaClasse(false)])} style={{ ...estilo.botaoSecundario, padding: '8px 14px' }}>+ Adicionar classe</button>
      </Secao>

      <Secao titulo="Andamento" descricao="Os prazos calculados pela lei (oposição, recurso, concessão e vigência) entram na próxima etapa.">
        <Grade>
          <Selecao label="Status" obrigatorio value={f.status} onChange={v => mudar('status', v)} opcoes={STATUS_OPCOES} />
          <Texto label="Prazo vigente" tipo="date" value={f.prazo} onChange={v => mudar('prazo', v)} />
        </Grade>
      </Secao>

      <Secao titulo="Operação">
        <Grade>
          <Texto label="Link da pasta no Drive" tipo="url" placeholder="https://" value={f.drive_url} onChange={v => mudar('drive_url', v)} erro={erros.drive_url} />
          <Texto label="ID no CRM" value={f.crm_id} onChange={v => mudar('crm_id', v)} />
          <Campo label="Nome da pasta" span={2} dica="Gerado: PROC-{número ou PENDENTE}_{nome curto}_NCL{classe principal}.">
            <div style={{ ...estilo.input, background: cor.fundoSuave, color: cor.textoSec, fontFamily: fonte.mono, fontSize: '13px', minHeight: '38px' }}>{nomePastaGerado || '—'}</div>
          </Campo>
          <Chips label="Etiquetas" span={2} valores={f.etiquetas} onChange={v => mudar('etiquetas', v)} placeholder="Digite e pressione Enter" />
          <Area label="Observações" span={2} value={f.observacoes} onChange={v => mudar('observacoes', v)} />
        </Grade>
      </Secao>

      <CamposPersonalizados entidade="processo" valores={extras} onChange={setExtras} />
    </FormPagina>
  )
}
