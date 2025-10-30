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
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleApiScopes: process.env.GOOGLE_API_SCOPES,
    },
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }
})

