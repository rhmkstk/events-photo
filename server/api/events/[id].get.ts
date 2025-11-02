// server/api/events/[id].get.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, message: 'eventId required' })
  }

  const admin = serverSupabaseServiceRole(event)
  const { data, error } = await admin
    .from('events')
    .select('id, title, start_date')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }
  if (!data) {
    // bulunamadı
    return { ok: false, message: 'Event not found' }
  }

  // burada istersen "5 gün geçti mi" kontrolünü de ekleyebilirsin
  // aynı logic: start_date + 5 gün < now ise expired
  const start = new Date(data.start_date)
  const expires = new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000)
  const now = new Date()

  if (now > expires) {
    return { ok: false, message: 'Event expired' }
  }

  return { ok: true, event: data }
})
