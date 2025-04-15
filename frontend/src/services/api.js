import axios from 'axios';

// Use environment variable for API URL, fallback for local dev
// Create a .env file in frontend/ directory: VITE_API_URL=http://localhost:3000/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Creates a new secret.
 * @param {string} encryptedSecretBase64 Base64 encoded encrypted text.
 * @returns {Promise<string>} The reference ID for the secret.
 */
export const createSecret = async (encryptedSecretBase64) => {
    try {
        const response = await apiClient.post('/secrets', {
            encryptedSecret: encryptedSecretBase64,
        });
        return response.data.referenceId;
    } catch (error) {
        console.error("API Error (createSecret):", error.response || error.message);
        throw new Error(error.response?.data?.message || "Failed to create secret on server.");
    }
};

/**
 * Attempts to consume a secret.
 * @param {string} referenceId The ID of the secret.
 * @returns {Promise<string>} The base64 encoded encrypted secret text from the server.
 */
export const consumeSecret = async (referenceId) => {
    try {
        const response = await apiClient.post(`/secrets/${referenceId}/consume`);
        return response.data.encryptedSecret; // Return the encrypted data
    } catch (error) {
         console.error(`API Error (consumeSecret ${referenceId}):`, error.response?.status, error.response?.data);
        // Throw specific errors based on status code
        if (error.response) {
             if (error.response.status === 404 || error.response.status === 410) {
                throw new Error('SECRET_UNAVAILABLE'); // Specific error type for frontend logic
             } else if (error.response.status === 429) {
                throw new Error('RATE_LIMITED'); // Specific error type
             }
        }
        // Generic error for other cases
        throw new Error(error.response?.data?.message || "Failed to retrieve secret from server.");
    }
};