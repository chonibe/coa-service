/**
 * Upload a file with progress tracking using XMLHttpRequest
 * The standard fetch() API doesn't support upload progress events
 */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<{ ok: boolean; status: number; json: () => Promise<any> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    })

    // Handle completion
    xhr.addEventListener("load", () => {
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => {
          try {
            return JSON.parse(xhr.responseText)
          } catch {
            return { error: xhr.responseText || "Unknown error" }
          }
        },
      })
    })

    // Handle errors
    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"))
    })

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled"))
    })

    // Send request
    xhr.open("POST", url)
    xhr.withCredentials = true
    xhr.send(formData)
  })
}
