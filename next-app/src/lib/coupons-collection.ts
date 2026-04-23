/**
 * Nome da coleção de cupons no PocketBase.
 * No BD pode estar como "coupons" (inglês) ou "cupons" (português).
 * Configure POCKETBASE_COUPONS_COLLECTION=cupons no .env se os cupons não aparecerem na lista.
 */
export const COUPONS_COLLECTION =
  process.env.POCKETBASE_COUPONS_COLLECTION?.trim() || 'coupons'
