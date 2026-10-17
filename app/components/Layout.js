'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { cor, fonte } from '../../lib/tema'

const itens = [
  { section: 'Operação', label: 'Painel', href: '/dashboard', svg: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { section: 'Operação', label: 'Processos', href: '/processos', svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { section: 'Operação', label: 'Clientes', href: '/clientes', svg: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { section: 'Operação', label: 'Kanban', href: '/kanban', svg: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { section: 'Gestão', label: 'Relatórios', href: '/relatorios', svg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { section: 'Gestão', label: 'Configurações', href: '/configuracoes', svg: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

const sections = ['Operação', 'Gestão']

function Icon({ path }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {path.split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : 'M' + d} />
      ))}
    </svg>
  )
}

export default function Layout({ children, titulo, botaoAcao }) {
  const [aberta, setAberta] = useState(true)
  const [busca, setBusca] = useState(false)
  const [termo, setTermo] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [totalProcessos, setTotalProcessos] = useState(null)
  const [resultados, setResultados] = useState([])
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUsuario(session.user)
    })
    supabase.from('processos').select('*', { count: 'exact', head: true }).then(({ count }) => {
      if (count !== null) setTotalProcessos(count)
    })
  }, [])

  useEffect(() => {
    const t = termo.replace(/[,()%*\\]/g, '').trim()
    if (t.length < 2) return
    let ativo = true
    const espera = setTimeout(async () => {
      const { data } = await supabase.from('processos').select('id, marca, numero_processo')
        .or(`marca.ilike.%${t}%,numero_processo.ilike.%${t}%`).limit(6)
      if (ativo) setResultados(data || [])
    }, 250)
    return () => { ativo = false; clearTimeout(espera) }
  }, [termo])

  useEffect(() => {
    function aoPressionar(e) {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setTermo('')
        setBusca(v => !v)
      }
      if (e.key === 'Escape') setBusca(false)
    }
    document.addEventListener('keydown', aoPressionar)
    return () => document.removeEventListener('keydown', aoPressionar)
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function abrirBusca() {
    setTermo('')
    setBusca(true)
  }

  const iniciais = usuario?.email?.substring(0, 2).toUpperCase() || 'U'
  const paginaAtual = itens.find(i => pathname === i.href || pathname.startsWith(i.href + '/'))
  const itensBusca = itens.filter(i => i.label.toLowerCase().includes(termo.toLowerCase()))
  const processosBusca = termo.trim().length >= 2 ? resultados : []

  return (
    <div style={{ display: 'flex', height: '100vh', background: cor.fundo, overflow: 'hidden', fontFamily: 'inherit', color: cor.texto }}>

      <aside style={{ width: aberta ? '256px' : '0', overflow: 'hidden', transition: 'width 0.3s', background: cor.menu, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        <div style={{ padding: '16px', borderBottom: `1px solid ${cor.menuBorda}`, minWidth: '256px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: cor.primario, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: cor.primarioTexto, fontSize: '14px', fontWeight: '700' }}>P</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: cor.menuTextoAtivo, margin: 0 }}>PIOS</p>
              <p style={{ fontSize: '11px', color: cor.menuTexto, margin: 0 }}>Gestão de marcas</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', minWidth: '256px' }}>
          {sections.map(section => (
            <div key={section} style={{ marginBottom: '12px' }}>
              <p style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '500', color: cor.menuTexto, margin: '0 0 4px', opacity: 0.8 }}>
                {section}
              </p>
              {itens.filter(i => i.section === section).map((item) => {
                const ativo = paginaAtual?.href === item.href
                return (
                  <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '2px', fontSize: '14px', textDecoration: 'none', color: ativo ? cor.menuTextoAtivo : cor.menuTexto, background: ativo ? cor.menuItemAtivo : 'transparent', fontWeight: ativo ? '500' : '400', borderRadius: '8px' }}>
                    <span style={{ display: 'flex', color: ativo ? cor.primario : cor.menuTexto }}>
                      <Icon path={item.svg} />
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.href === '/processos' && totalProcessos !== null && (
                      <span style={{ fontSize: '12px', color: cor.menuTexto }}>{totalProcessos}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={{ borderTop: `1px solid ${cor.menuBorda}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '256px' }}>
          <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.10)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: cor.menuTextoAtivo, fontSize: '12px', fontWeight: '600' }}>{iniciais}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: cor.menuTextoAtivo, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario?.email || ''}</p>
            <p style={{ fontSize: '11px', color: cor.menuTexto, margin: 0 }}>Administrador</p>
          </div>
          <button onClick={sair} title="Sair" aria-label="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer', color: cor.menuTexto, padding: '4px', display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ background: cor.card, borderBottom: `1px solid ${cor.borda}`, padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setAberta(!aberta)} aria-label="Recolher menu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: cor.textoSec, padding: '4px', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/>
              </svg>
            </button>
            <span style={{ width: '1px', height: '18px', background: cor.borda }} />
            <span style={{ fontSize: '14px', color: titulo && titulo !== 'Painel' ? cor.textoSec : cor.texto, fontWeight: titulo && titulo !== 'Painel' ? '400' : '500' }}>Painel</span>
            {titulo && titulo !== 'Painel' && <span style={{ fontSize: '14px', color: cor.texto, fontWeight: '500' }}>› {titulo}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={abrirBusca} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: cor.card, border: `1px solid ${cor.borda}`, borderRadius: '8px', padding: '7px 12px', width: '300px', fontSize: '13px', color: cor.textoSec, cursor: 'pointer', fontFamily: 'inherit' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <span style={{ flex: 1, textAlign: 'left' }}>Buscar marca, nº do processo…</span>
              <span style={{ fontSize: '11px', background: cor.fundoSuave, borderRadius: '4px', padding: '1px 6px' }}>Ctrl K</span>
            </button>
            <button aria-label="Notificações" style={{ background: 'none', border: 'none', cursor: 'pointer', color: cor.textoSec, display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            </button>
            {botaoAcao && (
              <button onClick={botaoAcao.onClick} style={{ background: cor.primario, color: cor.primarioTexto, border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                + {botaoAcao.label}
              </button>
            )}
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {busca && (
        <div onClick={() => setBusca(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(18,18,20,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '96px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: cor.card, borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: '480px', margin: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: `1px solid ${cor.borda}` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cor.textoClaro} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input autoFocus value={termo} onChange={e => setTermo(e.target.value)} placeholder="Buscar marca, nº do processo ou página…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', color: cor.texto, background: 'transparent' }} />
            </div>
            <div style={{ padding: '8px' }}>
              {processosBusca.length > 0 && (
                <>
                  <p style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '500', color: cor.textoSec, margin: 0 }}>Processos</p>
                  {processosBusca.map(p => (
                    <button key={p.id} onClick={() => { router.push(`/processos/${p.id}`); setBusca(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '8px', fontSize: '14px', color: cor.texto, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <span style={{ fontWeight: '500' }}>{p.marca}</span>
                      <span style={{ fontFamily: fonte.mono, fontSize: '12px', color: cor.textoSec }}>{p.numero_processo}</span>
                    </button>
                  ))}
                  <p style={{ padding: '8px 12px 4px', fontSize: '11px', fontWeight: '500', color: cor.textoSec, margin: 0 }}>Páginas</p>
                </>
              )}
              {itensBusca.length === 0 && processosBusca.length === 0 && <p style={{ padding: '8px 12px', fontSize: '14px', color: cor.textoSec, margin: 0 }}>Nenhum resultado.</p>}
              {itensBusca.map(item => (
                <button key={item.href} onClick={() => { router.push(item.href); setBusca(false) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '8px', fontSize: '14px', color: cor.texto, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ display: 'flex', color: cor.textoSec }}><Icon path={item.svg} /></span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
