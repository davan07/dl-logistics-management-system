const KEY_STRING = "dllms-secure-key-32bytes-for-aes"; // Must be exactly 32 bytes

async function getCryptoKey() {
  const keyBuffer = new TextEncoder().encode(KEY_STRING);
  return await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(plaintext: string): Promise<string> {
  const key = await getCryptoKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  
  // Combine IV and ciphertext (Web Crypto AES-GCM ciphertext automatically has the 16-byte auth tag appended!)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  // Convert to Base64
  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(base64Ciphertext: string): Promise<string> {
  const key = await getCryptoKey();
  const combined = Uint8Array.from(atob(base64Ciphertext), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}
