import * as fs from 'fs'
import * as path from 'path'

/**
 * Resolves the absolute path to the uploads directory.
 * Priority:
 * 1. Explicit env UPLOADS_DIR
 * 2. <repo_root>/apps/api/uploads (by walking up from this file)
 * Ensures the directory exists (recursive mkdir).
 */
export function resolveUploadsDir(): string {
  const envDir = process.env.UPLOADS_DIR?.trim()
  let target: string

  if (envDir) {
    target = path.isAbsolute(envDir) ? envDir : path.resolve(envDir)
  } else {
    const storageMode = process.env.FILE_STORAGE?.toLowerCase()
    if (storageMode === 'volume') {
      // Convention: mounted persistent volume path
      target = '/app/uploads'
    } else {
      // Fallback to repo-local uploads directory
      // __dirname = .../apps/api/src/common/utils
      const apiRoot = path.resolve(__dirname, '../../../') // points to apps/api
      target = path.join(apiRoot, 'uploads')
    }
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
  }

  return target
}

export function buildUploadFilePath(fileName: string): string {
  return path.join(resolveUploadsDir(), fileName)
}
