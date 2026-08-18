export const VERIFICATION_FILE_FIELDS = ['document_front', 'document_back', 'selfie']

export function isVerificationFileField(value) {
  return VERIFICATION_FILE_FIELDS.includes(value)
}

export function buildVerificationFilePath(recordId, field) {
  if (!recordId || !isVerificationFileField(field)) return null
  return `/api/admin/verification/${encodeURIComponent(recordId)}/file?field=${encodeURIComponent(field)}`
}
