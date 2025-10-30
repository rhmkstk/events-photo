import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export function getOAuthClient() {
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  })
}

async function getSavedTokens(event: H3Event, userId: string) {
  const admin = serverSupabaseServiceRole(event)
  const { data, error } = await admin
    .from('user_google_tokens')
    .select('*').eq('user_id', userId).maybeSingle()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
}

async function upsertTokens(event: H3Event, userId: string, patch: Partial<{
  provider_access_token: string | null
  provider_refresh_token: string | null
  expiry_date: number | null
  scope: string | null
  token_type: string | null
}>) {
  const admin = serverSupabaseServiceRole(event)
  const { error } = await admin
    .from('user_google_tokens')
    .upsert({ user_id: userId, updated_at: new Date().toISOString(), ...patch }, { onConflict: 'user_id' })
  if (error) throw createError({ statusCode: 500, message: error.message })
}

export async function getAuthedDrive(event: H3Event, userId: string) {
  const saved = await getSavedTokens(event, userId)
  if (!saved?.provider_refresh_token) {
    throw createError({ statusCode: 401, message: 'Google Drive izni yok' })
  }

  const oAuth2 = getOAuthClient()
  // access token süresi geçmiş olabilir; refresh varsa yeterli
  oAuth2.setCredentials({
    access_token: saved.provider_access_token ?? undefined,
    refresh_token: saved.provider_refresh_token ?? undefined,
    expiry_date: saved.expiry_date ?? undefined
  })

  // Yeni tokenler geldikçe DB’yi güncelle
  oAuth2.on('tokens', async (t) => {
    await upsertTokens(event, userId, {
      provider_access_token: t.access_token ?? null,
      provider_refresh_token: t.refresh_token ?? saved.provider_refresh_token ?? null,
      expiry_date: t.expiry_date ?? null,
      scope: t.scope ?? saved.scope ?? null,
      token_type: t.token_type ?? saved.token_type ?? null,
    })
  })

  const drive = google.drive({ version: 'v3', auth: oAuth2 })
  return { drive, oAuth2 }
}
