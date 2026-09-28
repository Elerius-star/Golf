// UI Module - Handles all DOM updates and user interactions
class UIManager {
    constructor() {
        this.elements = {
            queryInput: document.getElementById('queryInput'),
            submitBtn: document.getElementById('submitQuery'),
            clearBtn: document.getElementById('clearAll'),
            queryHistory: document.getElementById('queryHistory'),
            responseContainer: document.getElementById('responseContainer'),
            productTableBody: document.getElementById('productTableBody'),
            connectionStatus: document.querySelector('.status-dot'),
            statusText: document.querySelector('.status-indicator span:nth-child(2)'),
            backendUrl: document.getElementById('backendUrl')
        };
        this.queryHistory = [];
        this.maxHistoryItems = 10;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.elements.submitBtn.addEventListener('click', () => this.handleSubmit());
        this.elements.clearBtn.addEventListener('click', () => this.clearAll());
        this.elements.queryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSubmit();
            }
        });
    }

    async handleSubmit() {
        const query = this.elements.queryInput.value.trim();
        
        if (!query) {
            this.showError('Please enter a query');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
            // This will be connected in app.js
            const event = new CustomEvent('querySubmitted', {
                detail: { query }
            });
            document.dispatchEvent(event);
            
            // Add to history
            this.addToHistory(query);
            
        } catch (error) {
            this.showError('Failed to submit query. Please try again.');
        }
    }

    setLoadingState(isLoading) {
        const btn = this.elements.submitBtn;
        if (isLoading) {
            btn.innerHTML = '<div class="loading-spinner"></div> Processing...';
            btn.disabled = true;
        } else {
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Query';
            btn.disabled = false;
        }
    }

    addToHistory(query) {
        const timestamp = new Date().toLocaleTimeString();
        this.queryHistory.unshift({ query, timestamp });
        
        // Keep only last N items
        if (this.queryHistory.length > this.maxHistoryItems) {
            this.queryHistory.pop();
        }
        
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = this.elements.queryHistory;
        historyList.innerHTML = '';
        
        if (this.queryHistory.length === 0) {
            historyList.innerHTML = '<p class="placeholder-text">No queries yet</p>';
            return;
        }
        
        this.queryHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-query">${this.truncateText(item.query, 50)}</span>
                <span class="history-time">${item.timestamp}</span>
            `;
            historyList.appendChild(historyItem);
        });
    }

    updateResponse(responseData) {
        // Clear loading state
        this.setLoadingState(false);
        
        // Update response text
        const responseHTML = `
            <div class="response-text">
                <strong>Response:</strong> ${responseData.response}
                ${responseData.products && responseData.products.length > 0 
                    ? `<br><small>Found ${responseData.products.length} product(s)</small>` 
                    : ''}
            </div>
        `;
        
        this.elements.responseContainer.innerHTML = responseHTML;
        
        // Update product table
        this.updateProductTable(responseData.products || []);
    }

    updateProductTable(products) {
        const tableBody = this.elements.productTableBody;
        
        if (!products || products.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="4">No products found. Try a different query.</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${product.name}</strong></td>
                <td><span class="price">${product.price}</span></td>
                <td><span class="category-badge">${product.category}</span></td>
                <td><button class="btn-details">View Details</button></td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateConnectionStatus(isConnected) {
        const dot = this.elements.connectionStatus;
        const text = this.elements.statusText;
        
        if (isConnected) {
            dot.classList.add('connected');
            text.textContent = 'Backend Connection: Connected';
        } else {
            dot.classList.remove('connected');
            text.textContent = 'Backend Connection: Disconnected';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        errorDiv.style.cssText = `
            background: #fed7d7;
            color: #c53030;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        this.elements.responseContainer.innerHTML = '';
        this.elements.responseContainer.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    clearAll() {
        this.elements.queryInput.value = '';
        this.elements.responseContainer.innerHTML = 
            '<p class="placeholder-text">Submit a query to see the response here...</p>';
        this.elements.productTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4">No products to display. Enter a query to search.</td>
            </tr>
        `;
    }

    truncateText(text, maxLength) {
        return text.length > maxLength 
            ? text.substring(0, maxLength) + '...' 
            : text;
    }
}

// Export as ES6 module
export const uiManager = new UIManager();