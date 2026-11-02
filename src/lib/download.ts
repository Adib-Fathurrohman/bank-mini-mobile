import { Directory, File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { apiUrl, authHeaders } from '@/api/client'
import { networkError } from '@/api/errors'

/** Native: download the PDF with the session token, then open the share sheet. Web: download.web.ts. */
export async function downloadPdf(path: string, query: Record<string, string>, fileName: string): Promise<void> {
  const folder = new Directory(Paths.cache, 'mutasi')
  folder.create({ idempotent: true, intermediates: true })
  const target = new File(folder, fileName)
  if (target.exists) target.delete()

  const task = File.createDownloadTask(apiUrl(path, query), target, { headers: { ...authHeaders(), Accept: 'application/pdf' } })
  let file: File | null
  try {
    file = await task.downloadAsync()
  } catch {
    // The download API does not expose the error body; the most likely cause is the network.
    throw networkError()
  }
  if (!file) return
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: fileName, UTI: 'com.adobe.pdf' })
  }
}
