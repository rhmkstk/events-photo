import { serverSupabaseClient, serverSupabaseUser,serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  console.log('user', user)
  if (!user) throw createError({ statusCode: 401, message: 'Login required' })

  const sb = await serverSupabaseClient(event)
  const { data: { session }, error } = await sb.auth.getSession()
  console.log('session', session)
  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!session) throw createError({ statusCode: 401, message: 'No session' })

  // Supabase session -> Google provider token'ları:
  const providerAccessToken = (session as any).provider_token as string | undefined
  const providerRefreshToken = (session as any).provider_refresh_token as string | undefined
  
  console.log('providerAccessToken', providerAccessToken)
  console.log('providerRefreshToken', providerRefreshToken)

  if (!providerAccessToken) {
    // İlk girişte bazen provider token gelmeyebilir; kullanıcıyı tekrar denetebilirsiniz.
    return { ok: false, reason: 'No provider token' }
  }

  // DB'ye yaz
  const admin = serverSupabaseServiceRole(event)
  const expiryMs = session?.expires_at ? session.expires_at * 1000 : null
const expiryIso = expiryMs ? new Date(expiryMs).toISOString() : null
  const { error: upsertErr } = await admin
    .from('user_google_tokens')
    .upsert({
      user_id: user.id,
      provider_access_token: providerAccessToken,
      provider_refresh_token: providerRefreshToken ?? null,
      updated_at: new Date().toISOString(),
      expiry_date: expiryIso,
      scope: process.env.GOOGLE_OAUTH_SCOPES ?? null,
      token_type: session.token_type ?? null,
    }, { onConflict: 'user_id' })
  if (upsertErr) throw createError({ statusCode: 500, message: upsertErr.message })

  return { ok: true }
})
