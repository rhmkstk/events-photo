<script setup lang="ts">
const route = useRoute()
const fileInputRef = ref<HTMLInputElement | null>(null)

const eventId = computed(() => route.params.id?.toString() || "")

const MAX_FILES = 10
const MAX_FILE_SIZE = 12 * 1024 * 1024
const TOTAL_MAX = 150 * 1024 * 1024

const selectedFiles = ref<File[]>([])
const uploading = ref(false)
const successMsg = ref<string | null>(null)
const errorMsg = ref<string | null>(null)
const progress = ref(0)
const eventTitle = ref<string | null>(null)
const eventLoading = ref(true)
const eventNotFound = ref(false)
let xhr: XMLHttpRequest | null = null

onMounted(async () => {
  if (!eventId.value) {
    eventNotFound.value = true
    eventLoading.value = false
    return
  }

  try {
    const res: any = await $fetch(`/api/events/${eventId.value}`, {
      method: "GET"
    })

    if (!res?.ok) {
      eventNotFound.value = true
      errorMsg.value = res?.message || "Bu etkinlik artık geçerli değil."
    } else {
      eventTitle.value = res.event.title
    }
  } catch (err: any) {
    eventNotFound.value = true
    errorMsg.value = err?.data?.message || "Böyle bir etkinlik bulunamadı."
  } finally {
    eventLoading.value = false
  }
})

function triggerFilePicker() {
  errorMsg.value = null
  successMsg.value = null
  fileInputRef.value?.click()
}

function handleFileSelect(e: Event) {
  if (eventNotFound.value) return

  errorMsg.value = null
  successMsg.value = null
  progress.value = 0

  const input = e.target as HTMLInputElement
  if (!input.files?.length) {
    selectedFiles.value = []
    return
  }

  const files = Array.from(input.files)

  if (files.length > MAX_FILES) {
    errorMsg.value = `En fazla ${MAX_FILES} fotoğraf seçebilirsiniz.`
    selectedFiles.value = []
    return
  }

  for (const f of files) {
    if (f.size > MAX_FILE_SIZE) {
      errorMsg.value = `Bazı dosyalar çok büyük (max ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB).`
      selectedFiles.value = []
      return
    }
  }

  const total = files.reduce((sum, f) => sum + f.size, 0)
  if (total > TOTAL_MAX) {
    errorMsg.value = `Toplam dosya boyutu ${(TOTAL_MAX / 1024 / 1024).toFixed(0)} MB'ı geçemez.`
    selectedFiles.value = []
    return
  }

  selectedFiles.value = files
}

async function handleUpload() {
  errorMsg.value = null
  successMsg.value = null
  progress.value = 0

  if (!eventId.value) {
    errorMsg.value = "Etkinlik ID bulunamadı. Lütfen QR kodu tekrar okutun."
    return
  }
  if (eventNotFound.value) {
    errorMsg.value = "Bu etkinlik bulunamadı veya artık geçerli değil."
    return
  }
  if (!selectedFiles.value.length) {
    errorMsg.value = "Lütfen en az bir fotoğraf seçin."
    return
  }

  uploading.value = true
  xhr = new XMLHttpRequest()

  try {
    const fd = new FormData()
    fd.append("eventId", eventId.value)
    for (const f of selectedFiles.value) fd.append("file", f, f.name)

    await new Promise<void>((resolve, reject) => {
      xhr!.open("POST", "/api/drive/upload")

      // upload başlarken biraz ilerlet (0'dan 3'e)
      xhr!.upload.onloadstart = () => {
        progress.value = 3
      }

      // upload kısmı: 0-90 aralığında tut
      xhr!.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const uploadedPercent = Math.round((event.loaded / event.total) * 90)
          // 90'dan fazla olmasın
          progress.value = Math.min(uploadedPercent, 90)
        }
      }

      // server yanıtı geldiğinde 100'e çek
      xhr!.onreadystatechange = () => {
        if (xhr!.readyState === 4) {
          progress.value = 100
        }
      }

      xhr!.onload = () => {
        if (xhr!.status >= 200 && xhr!.status < 300) {
          resolve()
        } else {
          let parsed: any = null
          try {
            parsed = JSON.parse(xhr!.responseText)
          } catch {
            // ignore parse error, we'll fall back to status text
          }
          console.log("Upload error response:", parsed || xhr!.responseText)
          const serverMessage =
            parsed?.message ||
            parsed?.data?.message ||
            parsed?.statusMessage ||
            xhr!.statusText
          reject(new Error(serverMessage || "Upload failed from client"))
        }
      }

      xhr!.onerror = () => reject(new Error("Network error"))
      xhr!.onabort = () => reject(new Error("Yükleme iptal edildi."))

      xhr!.send(fd)
    })

    successMsg.value = "Fotoğraflar başarıyla yüklendi. Teşekkürler ✨"
    selectedFiles.value = []
  } catch (e: any) {
    errorMsg.value = e.message || "Yükleme başarısız oldu."
    // hata olursa progress’i biraz geri çekmek daha net
    progress.value = 0
  } finally {
    uploading.value = false
    xhr = null
    // seçili input'u da temizlemek istersen:
    fileInputRef.value && (fileInputRef.value.value = "")
  }
}

function cancelUpload() {
  if (xhr && uploading.value) {
    xhr.abort()
    uploading.value = false
    progress.value = 0
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-xl shadow p-5 space-y-4">
      <h1 class="text-lg font-semibold text-center">
        Fotoğraf Yükle
      </h1>

      <!-- event yükleniyor -->
      <p v-if="eventLoading" class="text-xs text-gray-400 text-center">
        Etkinlik bilgisi alınıyor...
      </p>

      <!-- event bulunamadı -->
      <p v-else-if="eventNotFound" class="text-red-500 text-sm text-center">
        Böyle bir etkinlik bulunamadı veya artık geçerli değil.
      </p>

      <!-- event bulundu -->
      <div v-else class="text-center space-y-1">
        <p class="text-xs text-gray-500">
          Etkinlik ID: <strong>{{ eventId }}</strong>
        </p>
        <p v-if="eventTitle" class="text-sm font-medium">
          {{ eventTitle }}
        </p>
      </div>

      <!-- gizli input -->
       
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        :disabled="eventNotFound || eventLoading"
        @change="handleFileSelect"
      />

      <!-- daha anlaşılır buton -->
      <button
        type="button"
        class="w-full border border-dashed border-gray-300 rounded-lg py-3 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50"
        :disabled="eventNotFound || eventLoading || uploading"
        @click="triggerFilePicker"
      >
        📷 Fotoğraf seç / çek
      </button>

      <!-- seçilen dosyalar -->
      <ul v-if="selectedFiles.length" class="text-xs text-gray-600 space-y-1">
        <li v-for="file in selectedFiles" :key="file.name">
          {{ file.name }} ({{ (file.size / 1024 / 1024).toFixed(2) }} MB)
        </li>
      </ul>

      <!-- Progress bar -->
      <div v-if="uploading" class="w-full bg-gray-200 rounded h-2 overflow-hidden">
        <div
          class="bg-green-500 h-2 transition-all duration-150"
          :style="{ width: progress + '%' }"
        ></div>
      </div>

      <div v-if="uploading" class="flex justify-between items-center text-xs text-gray-500">
        <span>{{ progress }}%</span>
        <button class="text-red-500 underline" @click="cancelUpload">İptal Et</button>
      </div>

      <!-- upload button -->
      <button
        class="w-full bg-black text-white rounded-lg py-2 disabled:opacity-50"
        :disabled="uploading || !eventId || !selectedFiles.length || eventNotFound || eventLoading"
        @click="handleUpload"
      >
        {{ uploading ? "Yükleniyor..." : "Yükle" }}
      </button>

      <p v-if="errorMsg" class="text-red-500 text-sm text-center">{{ errorMsg }}</p>
      <p v-if="successMsg" class="text-green-600 text-sm text-center">{{ successMsg }}</p>
    </div>
  </div>
</template>
