// middleware/auth.client.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  // 1) Hızlı yol: user zaten varsa geç
  if (user.value) return

  // 2) İlk yüklemede user ref'i kısa süre boş olabilir; emin olmak için session'ı sor
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return

  // 3) Oturum yok → login'e gönder (geri dönüş adresini koru)
  return navigateTo(`/login?returnTo=${encodeURIComponent(to.fullPath)}`)
})
