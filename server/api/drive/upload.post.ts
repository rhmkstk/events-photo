import { Readable } from 'node:stream'
import { serverSupabaseServiceRole } from '#supabase/server'
import { getAuthedDrive } from '~/server/utils/google'
import filenamify from 'filenamify'
// import { rateLimitCheck, getClientIp } from '~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  // --- Rate limit ---
  // const ip = getClientIp(event.node.req)
  // const rl = rateLimitCheck(ip, {
  //   perMin: Number(process.env.RL_MAX_PER_MINUTE ?? 30),
  //   perHour: Number(process.env.RL_MAX_PER_HOUR ?? 400),
  //   perDay: Number(process.env.RL_MAX_PER_DAY ?? 3000),
  // })
  // if (!rl.ok) {
  //   throw createError({ statusCode: 429, message: 'Too Many Requests' })
  // }

  // --- reCAPTCHA ---
  // const secret = process.env.RECAPTCHA_SECRET
  // const form = await readMultipartFormData(event)
  // if (!form) throw createError({ statusCode: 400, message: 'form-data required' })

  // if (secret) {
  //   const recaptchaToken = form.find(p => p.name === 'recaptchaToken')?.data?.toString()
  //   if (!recaptchaToken) throw createError({ statusCode: 400, message: 'recaptchaToken required' })
  //   const body = new URLSearchParams({
  //     secret, response: recaptchaToken, remoteip: ip
  //   })
  //   const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
  //     method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
  //   }).then(r => r.json()).catch(() => ({ success: false }))
  //   const ok = res?.success === true && (typeof res.score === 'number' ? res.score >= 0.5 : true)
  //   if (!ok) throw createError({ statusCode: 403, message: 'recaptcha verification failed' })
  // }

  // --- Files & eventId ---

  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, message: 'form-data required' })
  const files = form.filter(p => p.name === 'file' && p.filename)
  const eventId = form.find(p => p.name === 'eventId')?.data?.toString()
  if (!eventId) throw createError({ statusCode: 400, message: 'eventId required' })
  if (!files.length) throw createError({ statusCode: 400, message: 'no files uploaded' })

  // --- Env limits ---
  const MAX_FILES = Number(process.env.UPLOAD_MAX_FILES ?? 10)
  const MAX_FILE_SIZE = Number(process.env.UPLOAD_MAX_FILE_SIZE_BYTES ?? 8 * 1024 * 1024)
  const TOTAL_MAX = Number(process.env.UPLOAD_TOTAL_MAX_BYTES ?? 50 * 1024 * 1024)
  if (files.length > MAX_FILES) {
    throw createError({ statusCode: 413, message: `Too many files. Max ${MAX_FILES}` })
  }

  let total = 0
  for (const f of files) {
    const size = (f.data as Buffer).length
    total += size
    if (size > MAX_FILE_SIZE) {
      throw createError({ statusCode: 413, message: `File "${f.filename}" exceeds ${MAX_FILE_SIZE} bytes` })
    }
    const m = f.type || ''
    if (!m.startsWith('image/')) {
      throw createError({ statusCode: 415, message: `Unsupported type "${m}". Only images.` })
    }
  }
  if (total > TOTAL_MAX) {
    throw createError({ statusCode: 413, message: `Total size exceeds ${TOTAL_MAX} bytes` })
  }

  // --- Event validity ---
  const admin = serverSupabaseServiceRole(event)
  const { data: ev, error } = await admin
    .from('events')
    .select('id, start_date, user_id, drive_folder_id, title')
    .eq('id', eventId)
    .maybeSingle()
  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!ev) throw createError({ statusCode: 404, message: 'event not found' })
  if (!ev.drive_folder_id) throw createError({ statusCode: 400, message: 'event has no drive_folder_id' })

  const start = new Date(ev.start_date).getTime()
  if (isNaN(start)) throw createError({ statusCode: 400, message: 'event start_date invalid' })
  const FIVE = Number(process.env.EVENT_VALIDITY_DAYS ?? 5) * 24 * 60 * 60 * 1000
  if (Date.now() > start + FIVE) throw createError({ statusCode: 410, message: 'event has expired' })

  // --- Drive upload (multipart, küçük dosyalar için) ---
  const { drive } = await getAuthedDrive(event, ev.user_id)
  const uploaded: any[] = []
  for (const f of files) {
    const safe = filenamify(f.filename || 'upload', { replacement: '-' }).slice(0, 200) || 'upload'
    try {
      const res = await drive.files.create({
        requestBody: { name: safe, parents: [ev.drive_folder_id] },
        media: { mimeType: f.type || 'application/octet-stream', body: Readable.from(f.data as Buffer) },
        fields: 'id,name,parents,size,mimeType,webViewLink'
      })
      uploaded.push({ ok: true, file: res.data })
    } catch (err: any) {
      uploaded.push({ ok: false, fileName: f.filename, error: err.message })
    }
  }

  return { ok: true, event: { id: ev.id, title: ev.title }, uploaded }
})
