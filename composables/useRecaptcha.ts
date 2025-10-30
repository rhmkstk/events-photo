export async function getRecaptchaToken(action = 'upload') {
  // @ts-ignore
  const grecaptcha = window.grecaptcha
  await grecaptcha.ready()
  return await grecaptcha.execute('YOUR_SITE_KEY', { action })
}