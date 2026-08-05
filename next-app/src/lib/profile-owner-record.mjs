/** Seleciona o rascunho mais recente quando existem duplicatas históricas. */
export function selectOwnerProfileRecord(records) {
  if (!Array.isArray(records) || records.length === 0) return null
  return records.reduce((latest, record) => {
    const latestTime = Date.parse(String(latest?.updated || latest?.created || ''))
    const recordTime = Date.parse(String(record?.updated || record?.created || ''))
    return Number.isFinite(recordTime) && (!Number.isFinite(latestTime) || recordTime > latestTime)
      ? record
      : latest
  }, records[0])
}
