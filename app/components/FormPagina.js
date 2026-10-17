'use client'

import Link from 'next/link'
import Layout from './Layout'
import { Aviso } from './Campos'
import { cor, estilo } from '../../lib/tema'

// Moldura das telas de cadastro: link de voltar, título, botões no topo e no fim, e lista de erros.
export default function FormPagina({ rotulo, titulo, descricao, voltarHref, voltarTexto, selo, children, onSalvar, onCancelar, salvando, erros = [], textoSalvar = 'Salvar', carregando }) {
  const botoes = (
    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
      <button type="button" onClick={onCancelar} style={{ ...estilo.botaoSecundario, padding: '8px 16px' }}>Cancelar</button>
      <button type="submit" disabled={salvando || carregando} style={{ ...estilo.botaoPrimario, padding: '8px 18px', opacity: salvando || carregando ? 0.6 : 1 }}>
        {salvando ? 'Salvando…' : textoSalvar}
      </button>
    </div>
  )

  const resumoErros = erros.length > 0 && (
    <Aviso tipo="erro">
      <strong>Revise o formulário:</strong>
      <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
        {erros.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </Aviso>
  )

  return (
    <Layout titulo={rotulo}>
      <form onSubmit={e => { e.preventDefault(); onSalvar() }} noValidate>
        <div style={{ borderBottom: `1px solid ${cor.borda}`, background: 'rgba(255,255,255,0.6)', padding: '20px 24px 24px' }}>
          <Link href={voltarHref} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: cor.texto, textDecoration: 'none', marginBottom: '16px' }}>
            ← {voltarTexto}
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '600', color: cor.texto, margin: 0, letterSpacing: '-0.01em' }}>{titulo}</h1>
                {selo}
              </div>
              {descricao && <p style={{ fontSize: '14px', color: cor.textoSec, margin: '6px 0 0' }}>{descricao}</p>}
            </div>
            {botoes}
          </div>
        </div>

        <div style={{ padding: '24px', maxWidth: '1040px' }}>
          {carregando ? <p style={{ color: cor.textoSec, fontSize: '14px' }}>Carregando…</p> : (
            <>
              {resumoErros}
              {children}
              {resumoErros}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '24px' }}>{botoes}</div>
            </>
          )}
        </div>
      </form>
    </Layout>
  )
}
