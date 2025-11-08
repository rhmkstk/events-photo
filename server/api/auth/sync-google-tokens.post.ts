// server/api/auth/sync-google-tokens.post.ts
import {
  serverSupabaseUser,
  serverSupabaseClient,
  serverSupabaseServiceRole
} from '#supabase/server'

export default defineEventHandler(async (event) => {
  // -------- 0) Kimlik doğrulama: cookie veya Bearer ----------
  let user = await serverSupabaseUser(event)

  // Erken istek yarışı için Bearer fallback (opsiyonel ama önerilir)
  if (!user) {
    const bearer = getHeader(event, 'authorization')?.split(' ')[1]
    if (bearer) {
      const sbTmp = await serverSupabaseClient(event)
      const { data, error } = await sbTmp.auth.getUser(bearer)
      if (!error && data?.user) {
        user = data.user
      }
    }
  }

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Login required' })
  }

  // -------- 1) Session: cookie okuyan normal server client ----------
  const sb = await serverSupabaseClient(event)
  const { data: sessionData, error: sessionErr } = await sb.auth.getSession()
  if (sessionErr) {
    throw createError({ statusCode: 500, statusMessage: sessionErr.message })
  }
  const session = sessionData?.session ?? null

  // -------- 2) Provider token'ları elde et ----------
  // Öncelik: session içindeki provider token'lar
  let providerAccessToken =
    (session as any)?.provider_token as string | undefined
  let providerRefreshToken =
    (session as any)?.provider_refresh_token as string | undefined
  const tokenType = (session as any)?.token_type as string | undefined

  // Fallback: client body ile göndermiş olabilir
  const body = await readBody<{
    providerAccessToken?: string
    providerRefreshToken?: string
    tokenType?: string
    expiryDate?: string // ISO
    scope?: string
  }>(event)

  if (!providerAccessToken && body?.providerAccessToken) {
    providerAccessToken = body.providerAccessToken
  }
  if (!providerRefreshToken && body?.providerRefreshToken) {
    providerRefreshToken = body.providerRefreshToken
  }

  // Expiry (session varsa ondan hesapla; yoksa body'den al)
  const expiryMs = session?.expires_at ? session.expires_at * 1000 : null
  const expiryIso =
    (expiryMs ? new Date(expiryMs).toISOString() : null) ??
    (body?.expiryDate ?? null)

  // Scope öncelik sırası: ENV → body
  const scope = process.env.GOOGLE_OAUTH_SCOPES ?? body?.scope ?? null

  if (!providerAccessToken) {
    // İlk girişten hemen sonra bazı akışlarda session'a provider_token düşmeyebilir.
    // Bu durumda client'tan retry veya body fallback ile tekrar çağrılmasını bekliyoruz.
    return {
      ok: false,
      reason: 'No provider token',
    }
  }

  // -------- 3) DB yazımı: service-role client ----------
  const admin = await serverSupabaseServiceRole(event)

  const { error: upsertErr } = await admin
    .from('user_google_tokens')
    .upsert(
      {
        user_id: user.id,
        provider_access_token: providerAccessToken,
        provider_refresh_token: providerRefreshToken ?? null,
        token_type: tokenType ?? body?.tokenType ?? null,
        expiry_date: expiryIso,
        scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (upsertErr) {
    throw createError({ statusCode: 500, statusMessage: upsertErr.message })
  }

  return { ok: true }
})
