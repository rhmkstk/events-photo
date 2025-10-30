<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
        Don't Miss
      </h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Etkinlik fotoğraflarınızı kolayca toplayın. Düğün, doğum günü, baby shower ve diğer özel anlarınızı kaçırmayın.
      </p>
    </div>

    <!-- Main Actions -->
    <div class="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
      <!-- Create Event Card -->
      <div class="card hover:shadow-xl transition-shadow duration-300">
        <div class="text-center">
          <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-3">Etkinlik Oluştur</h2>
          <p class="text-gray-600 mb-6">
            Yeni bir etkinlik oluşturun ve katılımcıların fotoğraflarını toplamaya başlayın.
          </p>
          <NuxtLink to="/create-event" class="btn-primary inline-block">
            Etkinlik Oluştur
          </NuxtLink>
        </div>
      </div>

      <!-- Upload Photos Card -->
      <div class="card hover:shadow-xl transition-shadow duration-300">
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-3">Fotoğraf Yükle</h2>
          <p class="text-gray-600 mb-6">
            QR kodu okutarak etkinlik fotoğraflarınızı yükleyin.
          </p>
          <button @click="showQRScanner = true" class="btn-primary inline-block">
            QR Kodu Okut
          </button>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
        Nasıl Çalışır?
      </h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            1
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Etkinlik Oluştur</h3>
          <p class="text-gray-600">
            Etkinlik bilgilerinizi girin ve Google Drive erişimi verin
          </p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            2
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">QR Kodu Paylaş</h3>
          <p class="text-gray-600">
            Oluşturulan QR kodu yazdırıp etkinlik alanına yerleştirin
          </p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            3
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Fotoğrafları Topla</h3>
          <p class="text-gray-600">
            Katılımcılar QR kodu okutup fotoğraflarını yüklesin
          </p>
        </div>
      </div>
    </div>

    <!-- QR Scanner Modal -->
    <div v-if="showQRScanner" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-gray-900 mb-4">QR Kodu Okut</h3>
        <p class="text-gray-600 mb-4">
          Telefonunuzun kamera uygulamasını kullanarak QR kodu okutun
        </p>
        <div class="flex gap-3">
          <button @click="showQRScanner = false" class="btn-secondary flex-1">
            İptal
          </button>
          <NuxtLink to="/upload" class="btn-primary flex-1 text-center">
            Manuel Giriş
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const showQRScanner = ref(false)
</script>
