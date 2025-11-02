// middleware/require-auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()

  // client-side'da user yoksa login'e
  if (!user.value) {
    return navigateTo('/login')
  }

})
