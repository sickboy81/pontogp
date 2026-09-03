export function getVerificationReviewSubjectUpdates(status) {
  if (status === 'approved') {
    return {
      profile: { verified: true },
      user: { document_verified: true },
    }
  }

  if (status === 'rejected') {
    return {
      profile: { verified: false },
      user: { document_verified: false },
    }
  }

  return null
}
