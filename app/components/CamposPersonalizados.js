'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { cor, estilo } from '../../lib/tema'
import { TIPOS_CAMPO_PERSONALIZADO } from '../../lib/campos'
import { Secao, Grade, Texto, Area, Selecao, SimNao, Aviso } from './Campos'

// Campos criados pelo próprio usuário. A definição fica em `campos_personalizados`
// e o valor de cada campo fica no JSON `campos_extras` do registro, com o id do campo como chave.
function CampoPersonalizado({ campo, valor, onChange, onArquivar }) {
  const rotulo = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {campo.titulo}
      <button type="button" onClick={onArquivar} title="Arquivar campo" aria-label={`Arquivar campo ${campo.titulo}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: cor.textoClaro, fontSize: '12px', padding: 0, fontFamily: 'inherit' }}>
        arquivar
      </button>
    </span>
  )

  if (campo.tipo === 'texto_longo') return <Area label={rotulo} value={valor} onChange={onChange} span={2} />
  if (campo.tipo === 'sim_nao') return <SimNao label={rotulo} value={!!valor} onChange={onChange} />
  if (campo.tipo === 'lista') return <Selecao label={rotulo} value={valor} onChange={onChange} opcoes={campo.opcoes || []} />
  if (campo.tipo === 'data') return <Texto label={rotulo} tipo="date" value={valor} onChange={onChange} />
  if (campo.tipo === 'numero') return <Texto label={rotulo} tipo="number" value={valor} onChange={onChange} />
  if (campo.tipo === 'moeda') return <Texto label={rotulo} tipo="number" step="0.01" placeholder="R$ 0,00" value={valor} onChange={onChange} />
  if (campo.tipo === 'link') return <Texto label={rotulo} tipo="url" placeholder="https://" value={valor} onChange={onChange} />
  return <Texto label={rotulo} value={valor} onChange={onChange} />
}

export default function CamposPersonalizados({ entidade, valores, onChange }) {
  const [campos, setCampos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [criando, setCriando] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('texto')
  const [opcoesTexto, setOpcoesTexto] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const { data, error } = await supabase.from('campos_personalizados').select('*')
        .eq('entidade', entidade).eq('ativo', true).order('ordem').order('created_at')
      if (!ativo) return
      if (error) setErro('Não foi possível carregar os campos personalizados: ' + error.message)
      setCampos(data || [])
      setCarregando(false)
    }
    carregar()
    return () => { ativo = false }
  }, [entidade])

  function fecharPainel() {
    setCriando(false)
    setTitulo('')
    setTipo('texto')
    setOpcoesTexto('')
    setErro('')
  }

  async function criar() {
    const t = titulo.trim()
    const opcoes = opcoesTexto.split('\n').map(o => o.trim()).filter(Boolean)
    if (!t) { setErro('Informe o título do campo.'); return }
    if (tipo === 'lista' && opcoes.length < 2) { setErro('Informe pelo menos duas opções, uma por linha.'); return }
    setSalvando(true)
    setErro('')
    const { data, error } = await supabase.from('campos_personalizados')
      .insert([{ entidade, titulo: t, tipo, opcoes: tipo === 'lista' ? opcoes : [], ordem: campos.length }])
      .select().single()
    setSalvando(false)
    if (error) {
      setErro(error.code === '23505' ? 'Já existe um campo com esse título.' : 'Não foi possível criar o campo: ' + error.message)
      return
    }
    setCampos(c => [...c, data])
    fecharPainel()
  }

  async function arquivar(campo) {
    if (!confirm(`Arquivar o campo "${campo.titulo}"? Os valores já preenchidos continuam guardados.`)) return
    const { error } = await supabase.from('campos_personalizados').update({ ativo: false }).eq('id', campo.id)
    if (error) { setErro('Não foi possível arquivar: ' + error.message); return }
    setCampos(c => c.filter(x => x.id !== campo.id))
  }

  return (
    <Secao titulo="Campos personalizados" descricao="Campos próprios do seu escritório. Aparecem em todos os cadastros deste tipo.">
      {erro && !criando && <Aviso tipo="erro">{erro}</Aviso>}

      {!carregando && campos.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Grade>
            {campos.map(c => (
              <CampoPersonalizado key={c.id} campo={c} valor={valores?.[c.id]}
                onChange={v => onChange({ ...(valores || {}), [c.id]: v })}
                onArquivar={() => arquivar(c)} />
            ))}
          </Grade>
        </div>
      )}

      {!criando ? (
        <button type="button" onClick={() => setCriando(true)} style={{ ...estilo.botaoSecundario, padding: '8px 14px' }}>
          + Criar campo personalizado
        </button>
      ) : (
        <div style={{ border: `1px dashed ${cor.bordaCampo}`, borderRadius: '10px', padding: '16px', background: cor.fundo }}>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Grade>
            <Texto label="Título do campo" obrigatorio value={titulo} onChange={setTitulo} placeholder="Ex.: Código no sistema do cliente"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); criar() } }} />
            <Selecao label="Tipo de campo" value={tipo} onChange={setTipo} opcoes={TIPOS_CAMPO_PERSONALIZADO} placeholder="Escolha o tipo" />
            {tipo === 'lista' && (
              <Area label="Opções da lista" obrigatorio span={2} linhas={4} value={opcoesTexto} onChange={setOpcoesTexto}
                dica="Uma opção por linha." placeholder={'Opção 1\nOpção 2'} />
            )}
          </Grade>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={criar} disabled={salvando} style={{ ...estilo.botaoPrimario, padding: '8px 16px', opacity: salvando ? 0.6 : 1 }}>
              {salvando ? 'Criando…' : 'Criar campo'}
            </button>
            <button type="button" onClick={fecharPainel} style={{ ...estilo.botaoSecundario, padding: '8px 16px' }}>Cancelar</button>
          </div>
        </div>
      )}
    </Secao>
  )
}
