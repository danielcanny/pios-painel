// Validações e máscaras usadas nos cadastros.

export const soDigitos = (v) => (v || '').replace(/\D/g, '')

export function cpfValido(v) {
  const c = soDigitos(v)
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  const digito = (base) => {
    let soma = 0
    for (let i = 0; i < base; i++) soma += Number(c[i]) * (base + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return digito(9) === Number(c[9]) && digito(10) === Number(c[10])
}

export function cnpjValido(v) {
  const c = soDigitos(v)
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false
  const digito = (n) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(c[i]) * pesos[i]
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  return digito(12) === Number(c[12]) && digito(13) === Number(c[13])
}

export function cpfCnpjValido(v) {
  const c = soDigitos(v)
  if (c.length === 11) return cpfValido(c)
  if (c.length === 14) return cnpjValido(c)
  return false
}

export function formatarCpfCnpj(v) {
  const c = soDigitos(v)
  if (c.length === 11) return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (c.length === 14) return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return v || ''
}

// Máscara progressiva: vai formatando conforme o usuário digita (CPF até 11 dígitos, CNPJ até 14).
export function mascaraCpfCnpj(v) {
  const c = soDigitos(v).slice(0, 14)
  if (c.length <= 11) {
    return c.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return c.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatarCep(v) {
  const c = soDigitos(v).slice(0, 8)
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c
}

export const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim())

export const urlValida = (v) => /^https?:\/\/\S+\.\S+/.test((v || '').trim())

export const numeroProcessoValido = (v) => /^[0-9]{9}$/.test(v || '')

// Converte '' em null para gravar campos opcionais no banco.
export const nuloSeVazio = (v) => (typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v ?? null)
