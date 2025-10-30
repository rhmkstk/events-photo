<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="p-6 bg-white rounded shadow-md">
      <h1 class="text-2xl font-bold mb-4">Login</h1>
      <button
        @click="loginWithGoogle"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Login with Google
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()

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

<style scoped>
/* Add any additional styles here */
</style>
