// Main Application Module
import { api } from './api.js';
import { uiManager } from './ui.js';
import { imageProcessor } from './imageProcessor.js';

class Application {
    constructor() {
        this.initializeApp();
    }

    async initializeApp() {
        console.log('Initializing Handwritten Image Query System...');
        
        // Update backend URL display
        uiManager.elements.backendUrl.textContent = api.baseURL;
        
        // Check backend health
        await this.checkSystemStatus();
        
        // Load query history
        await this.loadQueryHistory();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('System ready!');
    }

    async checkSystemStatus() {
        try {
            // Check backend
            const health = await api.checkHealth();
            uiManager.updateBackendStatus(health.status === 'healthy' ? 'Connected' : 'Disconnected');
            
            // Check OCR
            const ocr = await api.checkOCRStatus();
            uiManager.updateOCRStatus(ocr.status === 'ready' ? 'Ready' : 'Not Available');
            
            if (health.status !== 'healthy') {
                console.warn('Backend not connected. Make sure FastAPI is running.');
            }
        } catch (error) {
            uiManager.updateBackendStatus('Disconnected');
            uiManager.updateOCRStatus('Not Available');
            console.error('System status check failed:', error);
        }
    }

    async loadQueryHistory() {
        try {
            const response = await api.getQueryHistory(5);
            if (response.history) {
                uiManager.updateQueryHistory(response.history);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    setupEventListeners() {
        // Listen for image processing
        document.addEventListener('imageProcessing', async (event) => {
            await this.handleImageProcessing(event.detail);
        });
    }

    async handleImageProcessing(detail) {
        try {
            // Show loading state
            uiManager.showLoading('Processing image and extracting text...');
            imageProcessor.disableProcessButton();
            
            // Step 1: Process image through backend
            const result = await api.processImage(detail.image);
            
            if (!result || !result.extracted_text) {
                throw new Error('Could not extract text from image');
            }
            
            // Update extracted text in UI
            imageProcessor.updateExtractedText(result.extracted_text);
            
            // Step 2: Submit extracted text as query
            uiManager.showLoading('Searching for products...');
            
            const queryResult = await api.submitQuery(result.extracted_text);
            
            // Update results
            uiManager.updateResults({
                ...queryResult,
                original_query: result.extracted_text
            });
            
            // Update product table
            uiManager.updateProductTable(queryResult.products || []);
            
            // Reload history
            await this.loadQueryHistory();
            
            // Show success
            if (typeof toastr !== 'undefined') {
                toastr.success('Image processed successfully!');
            }
            
        } catch (error) {
            console.error('Image processing failed:', error);
            uiManager.showError(`Processing failed: ${error.message}`);
            
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to process image');
            }
        } finally {
            // Reset button state
            imageProcessor.resetProcessButton();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    
    // Add global function for product view
    window.viewProduct = (index) => {
        alert(`Viewing product at index ${index}`);
        // In real app, would show detailed view/modal
    };
});