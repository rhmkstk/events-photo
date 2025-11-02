<script setup lang="ts">
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function handleStartNow() {
  if (user.value) {
    await router.push('/events/create')
    return
  }
  await loginWithGoogle()
}

const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // Nuxt Supabase modülünün yönettiği callback sayfası
        scopes: [
          'openid',
          'email',
          'profile',
          'https://www.googleapis.com/auth/drive.file' // sadece uygulamanızın oluşturduğu / paylaşılan dosyalar
        ].join(' '),
        // Refresh token almak için *şart*:
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  if (error) {
    console.error('Google login failed:', error.message)
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
        Made events memorable
      </h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Etkinlik fotoğraflarınızı kolayca toplayın. Düğün, doğum günü, baby
        shower ve diğer özel anlarınızı kaçırmayın.
      </p>
    </div>
    <div class="w-full flex">
      <button
        @click="handleStartNow"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer mx-auto"
      >
        Hemen Başla
      </button>
    </div>
  </div>
</template>


