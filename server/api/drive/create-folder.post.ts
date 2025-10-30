// server/api/drive/create-folder.post.ts
import { serverSupabaseUser } from '#supabase/server'
import { getAuthedDrive } from '~/server/utils/google'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Login required' })
  const body = await readBody<{ name: string; parentId?: string }>(event)
  if (!body?.name) throw createError({ statusCode: 400, message: 'name required' })

  const { drive } = await getAuthedDrive(event, user.id)
  const res = await drive.files.create({
    requestBody: {
      name: body.name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: body.parentId ? [body.parentId] : undefined
    },
    fields: 'id,name,parents'
  })
  return res.data
})
