export function buildVerificationPayload({ profileId, userId, fullName, documentType, termsAccepted = false }) {
  return {
    profile: profileId,
    user: userId,
    status: 'pending',
    full_name: String(fullName || '').trim(),
    document_type: ['rg', 'cnh', 'passport'].includes(documentType) ? documentType : 'rg',
    terms_accepted: termsAccepted === true,
  }
}
