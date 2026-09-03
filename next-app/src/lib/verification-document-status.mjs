function reviewedAt(record) {
  const value = record?.reviewed_at || record?.created
  const timestamp = Date.parse(value || '')
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function getDocumentVerificationState(accountValue, requests = []) {
  const reviewed = requests
    .filter((request) => request?.status === 'approved' || request?.status === 'rejected')
    .reduce((latest, request) => (!latest || reviewedAt(request) >= reviewedAt(latest) ? request : latest), null)

  if (!reviewed) return accountValue === true
  return reviewed.status === 'approved'
}
