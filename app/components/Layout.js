'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const itens = [
  { section: 'Operacao', label: 'Painel', href: '/dashboard', svg: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { section: 'Operacao', label: 'Processos', href: '/processos', svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { section: 'Operacao', label: 'Clientes', href: '/clientes', svg: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { section: 'Operacao', label: 'Kanban', href: '/kanban', svg: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { section: 'Gestao', label: 'Relatorios', href: '/relatorios', svg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { section: 'Gestao', label: 'Configuracoes', href: '/configuracoes', svg: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

const sections = ['Operacao', 'Gestao']

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
  const [usuario, setUsuario] = useState(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUsuario(session.user)
    })
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const iniciais = usuario?.email?.substring(0, 2).toUpperCase() || 'U'

  return (
    <div style={{display:'flex',height:'100vh',background:'#f9fafb',overflow:'hidden',fontFamily:'Inter,-apple-system,BlinkMacSystemFont,sans-serif'}}>

      <aside style={{width:aberta?'224px':'0',overflow:'hidden',transition:'width 0.3s',background:'#fff',borderRight:'1px solid #e5e7eb',display:'flex',flexDirection:'column',flexShrink:0}}>
        
        <div style={{padding:'16px',borderBottom:'1px solid #f3f4f6'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'28px',height:'28px',background:'#0F6E56',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontSize:'12px',fontWeight:'bold'}}>P</span>
            </div>
            <div>
              <p style={{fontSize:'14px',fontWeight:'700',color:'#1f2937',margin:0}}>PIOS</p>
              <p style={{fontSize:'11px',color:'#9ca3af',margin:0}}>Gestao de marcas</p>
            </div>
          </div>
        </div>

        <nav style={{flex:1,padding:'8px 0',overflowY:'auto'}}>
          {sections.map(section => (
            <div key={section} style={{marginBottom:'8px'}}>
              <p style={{padding:'8px 16px 4px',fontSize:'11px',fontWeight:'600',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.05em',margin:0}}>
                {section}
              </p>
              {itens.filter(i => i.section === section).map((item) => {
                const ativo = pathname === item.href
                return (
                  <a key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 16px',fontSize:'14px',textDecoration:'none',color:ativo?'#0F6E56':'#4b5563',background:ativo?'rgba(15,110,86,0.08)':'transparent',fontWeight:ativo?'600':'400',borderRadius:'0'}}>
                    <span style={{color:ativo?'#0F6E56':'#9ca3af'}}>
                      <Icon path={item.svg} />
                    </span>
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={{borderTop:'1px solid #f3f4f6',padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:'#0F6E56',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{color:'#fff',fontSize:'12px',fontWeight:'600'}}>{iniciais}</span>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:'13px',fontWeight:'500',color:'#1f2937',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{usuario?.email || ''}</p>
            <p style={{fontSize:'11px',color:'#9ca3af',margin:0}}>Administrador</p>
          </div>
          <button onClick={sair} title="Sair" style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:'4px'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <header style={{background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'0 24px',height:'52px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <button onClick={() => setAberta(!aberta)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:'4px',display:'flex'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span style={{fontSize:'14px',color:'#9ca3af'}}>Painel</span>
            {titulo && <span style={{fontSize:'14px',color:'#374151',fontWeight:'500'}}>› {titulo}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <button onClick={() => setBusca(true)} style={{display:'flex',alignItems:'center',gap:'8px',background:'#f3f4f6',border:'none',borderRadius:'8px',padding:'6px 12px',fontSize:'13px',color:'#6b7280',cursor:'pointer'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Buscar
            </button>
            <button style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',display:'flex'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            </button>
            {botaoAcao && (
              <button onClick={botaoAcao.onClick} style={{background:'#0F6E56',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 16px',fontSize:'14px',fontWeight:'500',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}>
                + {botaoAcao.label}
              </button>
            )}
          </div>
        </header>
        <main style={{flex:1,overflowY:'auto',padding:'24px'}}>
          {children}
        </main>
      </div>

      {busca && (
        <div onClick={() => setBusca(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:50,display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'96px'}}>
          <div onClick={(e) => e.stopPropagation()} style={{background:'#fff',borderRadius:'12px',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',width:'100%',maxWidth:'480px',margin:'0 16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderBottom:'1px solid #e5e7eb'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input autoFocus placeholder="Buscar cliente, processo ou pagina..." style={{flex:1,border:'none',outline:'none',fontSize:'14px',fontFamily:'inherit'}} />
            </div>
            <div style={{padding:'8px'}}>
              {itens.map(item => (
                <button key={item.href} onClick={() => { router.push(item.href); setBusca(false) }} style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',padding:'8px 12px',background:'none',border:'none',borderRadius:'8px',fontSize:'14px',color:'#4b5563',cursor:'pointer',fontFamily:'inherit'}}>
                  <span style={{color:'#9ca3af'}}><Icon path={item.svg} /></span>
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