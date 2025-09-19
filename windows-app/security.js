/**
 * Security Module
 * Handles encryption, password protection, and secure storage
 */

const CryptoJS = require('crypto-js');

class SecurityManager {
    constructor() {
        this.encryptionKey = null;
        this.isLocked = false;
    }

    // Generate secure encryption key from password
    generateKey(password, salt = null) {
        if (!salt) {
            salt = CryptoJS.lib.WordArray.random(128/8);
        }
        
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 256/32,
            iterations: 10000
        });
        
        return {
            key: key,
            salt: salt
        };
    }

    // Encrypt sensitive data
    encrypt(data, password) {
        try {
            const { key, salt } = this.generateKey(password);
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key.toString()).toString();
            
            return {
                encrypted: encrypted,
                salt: salt.toString(),
                timestamp: Date.now()
            };
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    // Decrypt sensitive data
    decrypt(encryptedData, password) {
        try {
            const { encrypted, salt } = encryptedData;
            const { key } = this.generateKey(password, CryptoJS.enc.Hex.parse(salt));
            
            const decrypted = CryptoJS.AES.decrypt(encrypted, key.toString());
            const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedString) {
                throw new Error('Invalid password or corrupted data');
            }
            
            return JSON.parse(decryptedString);
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    // Hash password for verification
    hashPassword(password) {
        return CryptoJS.SHA256(password).toString();
    }

    // Verify password hash
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    // Generate secure random string
    generateSecureRandom(length = 32) {
        return CryptoJS.lib.WordArray.random(length).toString();
    }

    // Secure delete (overwrite memory)
    secureDelete(obj) {
        if (typeof obj === 'string') {
            obj = '0'.repeat(obj.length);
        } else if (typeof obj === 'object') {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = '0'.repeat(obj[key].length);
                }
            }
        }
    }
}

module.exports = SecurityManager;