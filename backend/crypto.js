import crypto from 'crypto';

const KEY_STRING = "dllms-secure-key-32bytes-for-aes"; // Must match frontend!

export function encryptData(plaintext) {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(KEY_STRING, 'utf-8');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  // Combine IV, ciphertext, and Auth Tag
  const combined = Buffer.concat([
    iv,
    Buffer.from(encrypted, 'hex'),
    authTag
  ]);
  
  return combined.toString('base64');
}

export function decryptData(base64Ciphertext) {
  const combined = Buffer.from(base64Ciphertext, 'base64');
  
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(combined.length - 16);
  const ciphertext = combined.subarray(12, combined.length - 16);
  
  const key = Buffer.from(KEY_STRING, 'utf-8');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, null, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
