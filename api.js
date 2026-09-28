// API Module - Handles all backend communication
const API_BASE_URL = 'http://localhost:8000';

class API {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Check backend connection
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/docs`);
            return response.ok;
        } catch (error) {
            console.error('Backend connection error:', error);
            return false;
        }
    }

    // Submit query to backend
    async submitQuery(queryText) {
        try {
            const response = await fetch(`${this.baseURL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: queryText
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Query submission error:', error);
            throw error;
        }
    }

    // Test endpoint for development
    async testEndpoint() {
        try {
            const response = await fetch(`${this.baseURL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: 'test electronics'
                })
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Export as ES6 module
export const api = new API();