# Don't Miss - Etkinlik Fotoğraf Toplama Uygulaması

Düğün, doğum günü, baby shower gibi etkinliklerde katılımcıların çektiği fotoğrafları kolayca toplamanızı sağlayan modern web uygulaması.

## Özellikler

- 🎉 **Etkinlik Oluşturma**: Etkinlik bilgilerinizi girin ve QR kod oluşturun
- 📱 **QR Kod Paylaşımı**: Oluşturulan QR kodu yazdırıp etkinlik alanına yerleştirin
- 📸 **Fotoğraf Yükleme**: Katılımcılar QR kodu okutup fotoğraflarını yüklesin
- ☁️ **Güvenli Depolama**: Tüm fotoğraflar Supabase Storage'da güvenle saklanır
- 📱 **Mobil Uyumlu**: Telefon ve tablet cihazlarda mükemmel çalışır

## Teknolojiler

- **Frontend**: Nuxt 3, Vue 3, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **QR Kod**: qrcode kütüphanesi
- **UI/UX**: Modern ve kullanıcı dostu tasarım

## Kurulum

### 1. Projeyi Klonlayın

```bash
git clone <repository-url>
cd dontmiss
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'da `supabase-schema.sql` dosyasını çalıştırın
4. Storage'da `event-photos` bucket'ını oluşturun

### 4. Environment Değişkenleri

`env.example` dosyasını `.env` olarak kopyalayın ve Supabase bilgilerinizi girin:

```bash
cp env.example .env
```

`.env` dosyasını düzenleyin:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Kullanım

### Etkinlik Oluşturma

1. Ana sayfada "Etkinlik Oluştur" butonuna tıklayın
2. Etkinlik bilgilerinizi girin (başlık, tarih, açıklama)
3. "Etkinlik Oluştur" butonuna tıklayın
4. Oluşturulan QR kodu yazdırın ve etkinlik alanına yerleştirin

### Fotoğraf Yükleme

1. Katılımcılar telefonlarının kamera uygulamasından QR kodu okutur
2. "Fotoğraf Yükle" sayfasına yönlendirilir
3. Galeriden fotoğraf seçer veya yeni fotoğraf çeker
4. "Fotoğrafı Yükle" butonuna tıklar
5. Fotoğraf otomatik olarak etkinlik sahibinin Google Drive'ına yüklenir

## Proje Yapısı

```
dontmiss/
├── pages/
│   ├── index.vue          # Ana sayfa
│   ├── create-event.vue   # Etkinlik oluşturma
│   └── upload.vue         # Fotoğraf yükleme
├── assets/
│   └── css/
│       └── main.css       # Tailwind CSS
├── supabase-schema.sql    # Veritabanı şeması
└── nuxt.config.ts         # Nuxt konfigürasyonu
```

## Deployment

### Vercel ile Deploy

1. Projeyi GitHub'a push edin
2. [Vercel](https://vercel.com) hesabınızla bağlayın
3. Environment değişkenlerini ekleyin
4. Deploy edin

### Netlify ile Deploy

1. Projeyi build edin: `npm run build`
2. `dist` klasörünü Netlify'e yükleyin
3. Environment değişkenlerini ekleyin

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
