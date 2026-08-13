export function buildVerificationPayload({ profileId, userId, fullName, documentType }) {
  return {
    profile: profileId,
    user: userId,
    status: 'pending',
    full_name: String(fullName || '').trim(),
    document_type: ['rg', 'cnh', 'passport'].includes(documentType) ? documentType : 'rg',
  }
}
