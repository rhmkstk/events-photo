// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/supabase'
  ],
  css: ['./assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
      tsconfigPaths()
    ],
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/auth/callback',
      exclude: ['/','/create-event']
    }
  }
})

