// Main Application Module - Orchestrates everything
import { api } from './api.js';
import { uiManager } from './ui.js';

class Application {
    constructor() {
        this.initializeApp();
    }

    async initializeApp() {
        console.log('Initializing Text Query Interface...');
        
        // Check backend connection
        await this.checkBackendConnection();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize history from localStorage
        this.loadHistory();
    }

    async checkBackendConnection() {
        const isConnected = await api.checkConnection();
        uiManager.updateConnectionStatus(isConnected);
        
        if (!isConnected) {
            console.warn('Backend not connected. Make sure FastAPI is running on http://localhost:8000');
        }
        
        return isConnected;
    }

    setupEventListeners() {
        // Listen for query submission from UI
        document.addEventListener('querySubmitted', async (event) => {
            const query = event.detail.query;
            await this.processQuery(query);
        });
    }

    async processQuery(query) {
        try {
            // Send query to backend
            const response = await api.submitQuery(query);
            
            // Update UI with response
            uiManager.updateResponse(response);
            
        } catch (error) {
            console.error('Error processing query:', error);
            uiManager.showError('Failed to process query. Please check backend connection.');
            uiManager.setLoadingState(false);
        }
    }

    loadHistory() {
        // Load from localStorage (optional enhancement)
        const savedHistory = localStorage.getItem('queryHistory');
        if (savedHistory) {
            uiManager.queryHistory = JSON.parse(savedHistory);
            uiManager.updateHistoryDisplay();
        }
    }

    saveHistory() {
        localStorage.setItem('queryHistory', JSON.stringify(uiManager.queryHistory));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    console.log('Text Query Interface is ready!');
});