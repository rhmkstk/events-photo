// server/api/events/create.post.ts
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { getAuthedDrive } from '~/server/utils/google'
import { normalizeFolderName } from '~/server/utils/helpers' // <= düzeltildi
import { H3Event } from 'h3'

type CreateEventBody = {
  title: string
  start_date: string
}

// QR için kanonik URL üret
function buildPublicUploadUrl(event: any, eventId: string) {
  // Nuxt/Nitro helper
  const url = getRequestURL(event)
  const origin = `${url.protocol}//${url.host}` // X-Forwarded-* ile de uyumlu çalışır
  return `${origin}/upload?eventId=${encodeURIComponent(eventId)}`
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Login required' })

  const body = await readBody<CreateEventBody>(event)
  if (!body?.title) throw createError({ statusCode: 400, message: 'title required' })
  if (!body?.start_date) throw createError({ statusCode: 400, message: 'start_date required' })

  const startDate = new Date(body.start_date)
  if (!isStartDateValid(startDate)) {
    throw createError({ statusCode: 400, message: 'start_date cannot be in the past' })
  }

  // 1) Drive klasörü oluştur
  const folderBase = normalizeFolderName(body.title)
  const folderName = await ensureUniqueDriveFolderName(event, user.id, folderBase)

  const { drive } = await getAuthedDrive(event, user.id)
  const folderRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      // parents: ['APP_ROOT_FOLDER_ID'] // istersen sabit bir root altında
    },
    fields: 'id,name'
  })
  const driveFolderId = folderRes.data.id
  if (!driveFolderId) {
    throw createError({ statusCode: 502, message: 'Drive folder could not be created' })
  }

  // 2) DB insert
  const admin = serverSupabaseServiceRole(event)
  try {
    const { data, error } = await admin
      .from('events')
      .insert({
        start_date: startDate.toISOString(),
        title: body.title,
        user_id: user.id,
        drive_folder_id: driveFolderId,
      })
      .select('id,title,start_date,drive_folder_id')
      .maybeSingle()

    if (error) throw error
    if (!data?.id) throw createError({ statusCode: 500, message: 'Event insert did not return id' })

    // 3) QR için kanonik upload URL'i ekle
    const qrUrl = buildPublicUploadUrl(event, data.id)

    return {
      ok: true,
      event: data,
      drive_folder: { id: driveFolderId, name: folderRes.data.name },
      qr_upload_url: qrUrl,         // <— client doğrudan bunu QR’a basabilir
    }
  } catch (e) {
    // DB patlarsa Drive klasörünü çöpe yolla (rollback)
    try {
      await drive.files.update({
        fileId: driveFolderId!,
        requestBody: { trashed: true },
        fields: 'id,trashed'
      })
    } catch (trashErr) {
      console.error('[Drive] rollback (trash) failed:', trashErr)
    }
    throw createError({ statusCode: 500, message: (e as Error).message })
  }
})

function isStartDateValid(startDate: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return startDate >= today
}

async function ensureUniqueDriveFolderName(event: H3Event, userId: string, base: string): Promise<string> {
  const { drive } = await getAuthedDrive(event, userId)

  const q = `name = '${base.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  const list = await drive.files.list({ q, fields: 'files(id,name)' })
  if (!list.data.files?.length) return base

  const pad = (n: number) => n.toString().padStart(3, '0')
  for (let i = 1; i < 1000; i++) {
    const candidate = `${base}-${pad(i)}`
    const q2 = `name = '${candidate.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    const res = await drive.files.list({ q: q2, fields: 'files(id)' })
    if (!res.data.files?.length) return candidate
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}
