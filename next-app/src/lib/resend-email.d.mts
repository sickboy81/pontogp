export type ResendEmailConfig = {
  apiKey: string
  from: string
  contactTo: string
}

export declare function getResendEmailConfig(env?: Record<string, string | undefined>): ResendEmailConfig | null
export declare function getResendTransactionalConfig(env?: Record<string, string | undefined>): Pick<ResendEmailConfig, 'apiKey' | 'from'> | null
export declare function buildContactEmail(
  contact: { name: unknown; email: unknown; subject: unknown; message: unknown },
  config: Pick<ResendEmailConfig, 'from' | 'contactTo'>,
): Record<string, unknown>
export declare function buildLoginAlertEmail(
  user: { email?: unknown },
  ip: string,
  occurredAt: Date,
  config: Pick<ResendEmailConfig, 'from'>,
): Record<string, unknown>
export declare function buildProfileCompletionReminderEmail(input: {
  email: unknown
  name?: unknown
  appUrl?: string
  from: string
}): Record<string, unknown>
export declare function sendResendEmail(
  payload: Record<string, unknown>,
  apiKey: string,
  fetchImpl?: typeof fetch,
): Promise<unknown>
export declare function buildPocketBaseResendSettings(input: {
  apiKey: string
  appUrl?: string
}): Record<string, unknown>
export declare function buildPocketBaseEmailTemplates(appUrl?: string): Record<string, any>
