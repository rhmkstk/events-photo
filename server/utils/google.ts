// server/utils/google.ts
import { google } from 'googleapis'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI! // callback’inle aynı olsun

// DB'den token'ları çek ve gerekirse yenile
export async function getAuthedDrive(
  event: H3Event,
  userId: string,
  opts: { refreshIfExpired?: boolean } = { refreshIfExpired: true }
) {
  const admin = serverSupabaseServiceRole(event)

  const { data: row, error } = await admin
    .from('user_google_tokens')
    .select('provider_access_token, provider_refresh_token, expiry_date, scope, token_type')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }
  if (!row) {
    throw createError({ statusCode: 401, message: 'Google tokens not found for user' })
  }

  let accessToken = row.provider_access_token as string | null
  const refreshToken = row.provider_refresh_token as string | null
  const expiryDateIso = row.expiry_date as string | null

  // expiry_date ISO ise ms'e çevir
  const expiryMs = expiryDateIso ? new Date(expiryDateIso).getTime() : null
  const now = Date.now()

  const needsRefresh =
    opts.refreshIfExpired &&
    (!!refreshToken) &&
    (
      !accessToken || // yoksa
      (expiryMs !== null && expiryMs - 60_000 < now) // 1 dk önce expired say
    )

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  )

  // ilk set
  oauth2Client.setCredentials({
    access_token: accessToken || undefined,
    refresh_token: refreshToken || undefined,
  })

  if (needsRefresh) {
    // refresh token yoksa zaten yukarıda throw etmiştik
    const tokenRes = await oauth2Client.refreshAccessToken()
    const credentials = tokenRes.credentials

    accessToken = credentials.access_token || accessToken

    // yeni expiry'yi hesapla
    const expiresIn = (credentials as any).expires_in as number | undefined
    const newExpiryMs = credentials.expiry_date
    ? credentials.expiry_date
    : expiresIn
      ? now + expiresIn * 1000
      : null

    // DB'ye geri yaz
    const { error: upErr } = await admin
      .from('user_google_tokens')
      .update({
        provider_access_token: accessToken,
        expiry_date: newExpiryMs ? new Date(newExpiryMs).toISOString() : null,
      })
      .eq('user_id', userId)

    if (upErr) {
      console.error('[google] token refresh stored but update failed:', upErr)
    }

    // client’a da yeni credential’ı ver
    oauth2Client.setCredentials({
      access_token: accessToken || undefined,
      refresh_token: refreshToken || undefined,
      expiry_date: newExpiryMs || undefined,
    })
  }

  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  return { drive, oauth2Client }
}
