function getStatus(error) {
  return Number(error?.status) || 0
}

export function getLoginErrorMessage(error) {
  const status = getStatus(error)
  if (status === 400 || status === 401) {
    return 'Email ou senha incorretos, ou o email ainda não foi confirmado. Confira seus dados e tente novamente.'
  }
  if (status === 403) {
    return 'Confirme seu email antes de entrar. Se não recebeu a mensagem, solicite um novo email de confirmação.'
  }
  if (status === 429) {
    return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
  }
  if (status === 0) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
  }
  return 'Não foi possível entrar agora. Tente novamente em instantes.'
}

export function shouldOfferVerificationResend(error) {
  return [400, 401, 403].includes(getStatus(error))
}
