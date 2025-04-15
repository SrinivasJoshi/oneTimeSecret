/**
 * Base64url encodes an ArrayBuffer or Uint8Array.
 * @param {ArrayBuffer | Uint8Array} buffer The buffer to encode.
 * @returns {string} The base64url encoded string.
 */
function base64urlEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64url decodes a string to a Uint8Array.
 * @param {string} base64urlString The base64url encoded string.
 * @returns {Uint8Array} The decoded byte array.
 */
function base64urlDecode(base64urlString) {
    // Add padding back if necessary
    let base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding) {
        base64 += '='.repeat(4 - padding);
    }
    try {
        const raw = atob(base64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
            bytes[i] = raw.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.error("Base64 decoding failed:", e);
        throw new Error("Invalid base64url string");
    }
}

/**
 * Encrypts text using AES-GCM.
 * @param {string} plaintext The text to encrypt.
 * @returns {Promise<{encryptedBase64: string, ivBase64: string, keyBase64: string}>} Object containing base64url encoded encrypted data, IV, and key.
 */
export async function encryptSecret(plaintext) {
    try {
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true, // extractable
            ['encrypt', 'decrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12)); // Recommended IV size for AES-GCM

        const encodedText = new TextEncoder().encode(plaintext);

        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encodedText
        );

        // Export the key to share it
        const exportedKey = await crypto.subtle.exportKey('raw', key);

        return {
            encryptedBase64: base64urlEncode(encryptedData),
            ivBase64: base64urlEncode(iv),
            keyBase64: base64urlEncode(exportedKey),
        };
    } catch (error) {
        console.error("Encryption failed:", error);
        throw new Error("Could not encrypt secret.");
    }
}

/**
 * Decrypts data using AES-GCM.
 * @param {string} encryptedBase64 Base64url encoded encrypted data from the API.
 * @param {string} ivBase64 Base64url encoded IV from the URL fragment.
 * @param {string} keyBase64 Base64url encoded key from the URL fragment.
 * @returns {Promise<string>} The decrypted plaintext string.
 */
export async function decryptSecret(encryptedBase64, ivBase64, keyBase64) {
    try {
        const keyBytes = base64urlDecode(keyBase64);
        const iv = base64urlDecode(ivBase64);
        const encryptedData = base64urlDecode(encryptedBase64);

        // Import the key
        const key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-GCM' },
            true, // extractable is not strictly needed for decryption but often set
            ['decrypt']
        );

        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encryptedData
        );

        return new TextDecoder().decode(decryptedData);
    } catch (error) {
        console.error("Decryption failed:", error);
        // Error could be due to bad key, bad data (tampering), bad IV etc.
        throw new Error("Could not decrypt secret. It might be invalid, tampered, or the key is wrong.");
    }
}