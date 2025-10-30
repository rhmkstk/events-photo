import slugify from '@sindresorhus/slugify'
import filenamify from 'filenamify'

/** Event title -> güvenli klasör adı (locale: tr, max 60) */
export function normalizeFolderName(title: string, maxLen = 60) {
  // 1) Türkçe uyumlu, okunaklı slug
  const slug = slugify(title, {
    locale: 'tr',
    separator: '-',       // boşlukları tire yap
    lowercase: false,     // İstersen true da yapabilirsin
    decamelize: false,    // Başlık zaten cümle; devre dışı
    customReplacements: [
      ['&', ' ve '],      // örnek: ekstra isteklerin varsa
    ],
  })

  // 2) Klasör adı olarak güvenli hâle getir
  const safe = filenamify(slug, { replacement: '-' })

  // 3) Uzunluğu sınırla ve fallback
  return (safe || 'event').slice(0, maxLen)
}
