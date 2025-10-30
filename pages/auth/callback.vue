<script setup lang="ts">
const supabase = useSupabaseClient()
const router = useRouter()

onMounted(async () => {
  const url = new URL(window.location.href)

  // 1) provider hatası ile döndüyse
  const providerError = url.searchParams.get('error')
  if (providerError) {
    console.error('OAuth provider error:', {
      error: providerError,
      code: url.searchParams.get('error_code'),
      desc: url.searchParams.get('error_description')
    })
    return
  }

  // 2) Önce mevcut session’a bak
  let { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    // 3) Session yoksa ve code geldiyse: PKCE exchange dene
    const code = url.searchParams.get('code')
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        console.error('exchangeCodeForSession error:', error.message)
        // Burada ister kullanıcıya "Tekrar dene" butonu göster, ister login’e geri yönlendir:
        // return router.replace('/login?retry=1')
        return
      }
      // exchange başarılı olduysa artık session var
      ;({ data: { session } } = await supabase.auth.getSession())
    }
  }

  if (!session) {
    // bu noktada hâlâ yoksa, kullanıcıyı login’e geri yönlendir
    return router.replace('/login?state=no-session')
  }

  // 4) Session var → server’a senkronize et (provider token/refresh token)
  await $fetch('/api/auth/sync-google-tokens', { method: 'POST' })

  // 5) bitti
  router.replace('/create-event')
})
</script>


<template>
  <div>Connecting your Google account…</div>
</template>
