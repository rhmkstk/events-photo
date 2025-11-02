// server/api/drive/upload.post.ts
import { Readable } from 'node:stream'
import { serverSupabaseServiceRole } from '#supabase/server'
import { getAuthedDrive } from '~/server/utils/google'

export default defineEventHandler(async (event) => {
  // 1) form-data al
  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, message: 'form-data required' })
  }

  const eventId = form.find((p) => p.name === 'eventId')?.data?.toString()
  if (!eventId) {
    throw createError({ statusCode: 400, message: 'eventId required' })
  }

  // birden fazla file olabilir
  const files = form.filter((p) => p.name === 'file' && p.filename)

  if (!files.length) {
    throw createError({ statusCode: 400, message: 'at least one file required' })
  }

  // 2) event'i DB'den bul
  const admin = serverSupabaseServiceRole(event)
  const { data: ev, error: evErr } = await admin
    .from('events')
    .select('id, user_id, drive_folder_id, start_date')
    .eq('id', eventId)
    .maybeSingle()

  if (evErr) {
    throw createError({ statusCode: 500, message: evErr.message })
  }
  if (!ev) {
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  // 3) event halen geçerli mi? (5 gün kuralı)
  const start = new Date(ev.start_date)
  const expires = new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000)
  if (Date.now() > expires.getTime()) {
    throw createError({ statusCode: 410, message: 'Event expired' })
  }

  // 4) event sahibinin Drive'ına yetkili client al (refresh'li!)
  const { drive } = await getAuthedDrive(event, ev.user_id, { refreshIfExpired: true })

  const uploaded: Array<{ ok: boolean; fileName: string; id?: string; error?: string }> = []

  for (const file of files) {
    try {
      const res = await drive.files.create({
        requestBody: {
          name: file.filename!,
          parents: ev.drive_folder_id ? [ev.drive_folder_id] : undefined,
        },
        media: {
          mimeType: file.type || 'application/octet-stream',
          body: Readable.from(file.data as Buffer),
        },
        fields: 'id,name,parents'
      })

      uploaded.push({
        ok: true,
        fileName: file.filename!,
        id: String(res.data.id)
      })
    } catch (err: any) {
      console.error('[drive upload] failed:', err?.message || err)
      uploaded.push({
        ok: false,
        fileName: file.filename!,
        error: err?.message || 'upload failed'
      })
    }
  }

  // eğer hepsi patladıysa ok:false dönelim
  const allFailed = uploaded.every((u) => !u.ok)

  return {
    ok: !allFailed,
    event: { id: ev.id, title: ev.title },
    uploaded,
  }
})
