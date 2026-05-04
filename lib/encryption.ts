import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY
  if (!key) return null
  if (key.length !== 64) {
    console.warn('ENCRYPTION_KEY must be 64-char hex string. Using plain storage.')
    return null
  }
  try {
    return Buffer.from(key, 'hex')
  } catch {
    return null
  }
}

export function encryptToken(token: string): {
  encrypted: string
  iv: string
  authTag: string
} {
  const key = getKey()
  if (!key) {
    // No encryption available — return plain (caller should warn)
    throw new Error('ENCRYPTION_KEY not configured')
  }
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

export function decryptToken(encrypted: string, iv: string, authTag: string): string {
  const key = getKey()
  if (!key) throw new Error('ENCRYPTION_KEY not configured')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export function isEncryptionConfigured(): boolean {
  return getKey() !== null
}
