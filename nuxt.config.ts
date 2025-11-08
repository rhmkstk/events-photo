// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    preset: process.env.NITRO_PRESET || 'netlify',
    externals: {
      inline: ['@nuxtjs/supabase']
    }
  },
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
    redirect:false,
    redirectOptions: {
      login: '/login',
      callback: '/auth/callback',
    }
  }
})

