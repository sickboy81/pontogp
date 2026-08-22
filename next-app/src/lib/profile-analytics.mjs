export function percentageChange(current, previous) {
  if (!Number.isFinite(previous) || previous <= 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function summarizeFullAnalytics({ views, clicks, messages, uniqueVisitors }) {
  return {
    ctr: views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0,
    messageRate: clicks > 0 ? Math.round((messages / clicks) * 1000) / 10 : 0,
    uniqueVisitors,
  }
}
