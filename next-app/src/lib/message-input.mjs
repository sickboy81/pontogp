const USER_ID_PATTERN = /^[a-z0-9]{15}$/i
const MAX_MESSAGE_LENGTH = 2000

export function validateMessageInput(senderId, recipientId, content) {
  const recipient = String(recipientId || '').trim()
  const message = String(content || '').trim()
  if (!USER_ID_PATTERN.test(recipient)) return { error: 'Destinatário inválido.' }
  if (recipient === senderId) return { error: 'Você não pode enviar mensagem para si mesmo.' }
  if (!message) return { error: 'Digite uma mensagem.' }
  if (message.length > MAX_MESSAGE_LENGTH) return { error: `A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.` }
  return { recipientId: recipient, content: message }
}

export { MAX_MESSAGE_LENGTH }
