import { apiUrl, authHeaders } from '@/api/client'
import { errorFromResponse, networkError } from '@/api/errors'

/** Web: fetch the PDF with the session token and save it under our own name (CORS hides Content-Disposition, L4). */
export async function downloadPdf(path: string, query: Record<string, string>, fileName: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(apiUrl(path, query), { headers: { ...authHeaders(), Accept: 'application/pdf' } })
  } catch {
    throw networkError()
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw errorFromResponse(response.status, body)
  }
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
