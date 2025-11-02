<script setup lang="ts">
import QRCode from 'qrcode'

definePageMeta({
  middleware: ['require-auth']
})

const title = ref('')
const startDate = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const eventId = ref<string | null>(null)
const qrDataUrl = ref<string | null>(null)
const qrLink = ref<string | null>(null) // kullanıcı tıklayıp açabilsin

async function onSubmit() {
  errorMsg.value = null
  eventId.value = null
  qrDataUrl.value = null
  qrLink.value = null
  loading.value = true

  try {
    const res: any = await $fetch('/api/events/create', {
      method: 'POST',
      body: { title: title.value, start_date: startDate.value }
    })

    const id = res?.event?.id as string | undefined
    if (!id) throw new Error('Event ID not returned')
    eventId.value = id

    // QR içeriği: server'ın verdiği kanonik URL (tercih edilir)
    const payloadUrl =
      res?.qr_upload_url ||
      `${location.origin}/upload/${encodeURIComponent(id)}`

    qrLink.value = payloadUrl
    qrDataUrl.value = await QRCode.toDataURL(payloadUrl, {
      margin: 2,
      scale: 6,
      errorCorrectionLevel: 'M'
    })
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || 'Failed to create event'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto p-4 space-y-4">
    <h1 class="text-xl font-semibold">Yeni Etkinlik Oluştur</h1>

    <form @submit.prevent="onSubmit" class="space-y-3">
      <div class="space-y-1">
        <label class="block text-sm">Başlık</label>
        <input v-model="title" type="text" class="w-full border rounded p-2" required />
      </div>

      <div class="space-y-1">
        <label class="block text-sm">Başlangıç</label>
        <input v-model="startDate" type="datetime-local" class="w-full border rounded p-2" required />
      </div>

      <button class="bg-black text-white rounded px-4 py-2" :disabled="loading">
        {{ loading ? 'Oluşturuluyor…' : 'Etkinliği Oluştur' }}
      </button>
    </form>

    <p v-if="errorMsg" class="text-red-600 text-sm">{{ errorMsg }}</p>

    <div v-if="eventId && qrDataUrl" class="mt-6 space-y-2 text-center">
      <p class="text-sm text-gray-600">
        Etkinlik ID: <strong>{{ eventId }}</strong>
      </p>

      <img :src="qrDataUrl" alt="Event QR" class="mx-auto w-56 h-56 border rounded" />

      <p v-if="qrLink" class="text-xs text-gray-500">
        QR içeriği: <a :href="qrLink" class="underline break-all" target="_blank" rel="noopener">{{ qrLink }}</a>
      </p>

      <p class="text-xs text-gray-500">Bu QR kodu davetlilerle paylaşabilirsiniz.</p>
    </div>
  </div>
</template>
