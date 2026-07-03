/**
 * upload-progress.ts — PUT upload sa progress callback-om.
 *
 * fetch() ne izlaže upload progress, pa direktni upload ka Supabase
 * Storage signed URL-u ide kroz XMLHttpRequest. Koriste ga checkout
 * StepUpload i portal RevisionUploadCard.
 */
export function putFileWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error("Upload nije uspeo"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload nije uspeo"));
    xhr.onabort = () => reject(new Error("Upload je prekinut"));
    xhr.send(file);
  });
}
