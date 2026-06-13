export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function hasRepeatedDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value)
}

function isValidCpf(value: string): boolean {
  if (value.length !== 11 || hasRepeatedDigits(value)) return false

  for (let digit = 9; digit < 11; digit += 1) {
    let sum = 0
    for (let index = 0; index < digit; index += 1) {
      sum += Number(value[index]) * (digit + 1 - index)
    }
    const checkDigit = ((sum * 10) % 11) % 10
    if (checkDigit !== Number(value[digit])) return false
  }

  return true
}

function isValidCnpj(value: string): boolean {
  if (value.length !== 14 || hasRepeatedDigits(value)) return false

  const calculateDigit = (length: number) => {
    let factor = length - 7
    let sum = 0
    for (let index = 0; index < length; index += 1) {
      sum += Number(value[index]) * factor
      factor -= 1
      if (factor === 1) factor = 9
    }
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  return calculateDigit(12) === Number(value[12]) && calculateDigit(13) === Number(value[13])
}

export function isValidCpfOrCnpj(value: string): boolean {
  const digits = onlyDigits(value)
  return isValidCpf(digits) || isValidCnpj(digits)
}

export function formatCpfOrCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
