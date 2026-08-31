export declare function selectOwnerProfileRecord<T extends { updated?: string; created?: string }>(
  records: T[]
): T | null

type ProfileOwnerFailure = { ok: false; status: number; error: string }
type ProfileOwnerSuccess<T> = {
  ok: true
  userId: string
  profile: T
  adminToken: string
}

export declare function authorizeProfileOwner<T = Record<string, unknown>>(options: {
  pbUrl: string
  profileId: string
  sessionToken: string
  fields?: string
  fetchImpl?: typeof fetch
  getAdminTokenImpl: () => Promise<string | null>
}): Promise<ProfileOwnerFailure | ProfileOwnerSuccess<T>>
