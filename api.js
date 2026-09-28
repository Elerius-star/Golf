// API Communication Module
const API_BASE_URL = 'http://localhost:8000';

class API {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'unhealthy', error: error.message };
        }
    }

    async checkOCRStatus() {
        try {
            const response = await fetch(`${this.baseURL}/health/ocr`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            return await response.json();
        } catch (error) {
            console.error('OCR status check failed:', error);
            return { status: 'unavailable', error: error.message };
        }
    }

    async uploadImage(imageFile) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            
            const response = await fetch(`${this.baseURL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    }

    async processImage(imageFile) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            
            const response = await fetch(`${this.baseURL}/process-image`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Processing failed: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Image processing error:', error);
            throw error;
        }
    }

    async submitQuery(queryText) {
        try {
            const response = await fetch(`${this.baseURL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ query: queryText })
            });
            
            if (!response.ok) {
                throw new Error(`Query failed: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Query submission error:', error);
            throw error;
        }
    }

    async getQueryHistory(limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/history?limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('History fetch error:', error);
            return { history: [] };
        }
    }

    async getProducts(category = null) {
        try {
            const url = category 
                ? `${this.baseURL}/products?category=${category}`
                : `${this.baseURL}/products`;
            
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Products fetch error:', error);
            return { products: [] };
        }
    }
}

export const api = new API();