import CryptoJS from 'crypto-js';
import { ENCRYPTION_CONFIG } from '../../constants/config';

class EncryptionService {
  private generateKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: ENCRYPTION_CONFIG.KEY_SIZE / 32,
      iterations: ENCRYPTION_CONFIG.ITERATIONS,
    }).toString();
  }

  encrypt(message: string, key: string): string {
    try {
      const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
      const iv = CryptoJS.lib.WordArray.random(128 / 8);
      const derivedKey = this.generateKey(key, salt);

      const encrypted = CryptoJS.AES.encrypt(message, derivedKey, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7,
      });

      const encryptedMessage = {
        salt: salt,
        iv: iv.toString(),
        ciphertext: encrypted.toString(),
      };

      return JSON.stringify(encryptedMessage);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  decrypt(encryptedData: string, key: string): string {
    try {
      const data = JSON.parse(encryptedData);
      const { salt, iv, ciphertext } = data;

      const derivedKey = this.generateKey(key, salt);

      const decrypted = CryptoJS.AES.decrypt(ciphertext, derivedKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7,
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.KEY_SIZE / 8).toString();
  }

  hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  verifyHash(data: string, hash: string): boolean {
    return this.hash(data) === hash;
  }
}

export const encryptionService = new EncryptionService();
