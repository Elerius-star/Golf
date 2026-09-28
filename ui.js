// UI Management Module
import { imageProcessor } from './imageProcessor.js';

class UIManager {
    constructor() {
        this.elements = {
            backendStatus: document.getElementById('backendStatus'),
            ocrStatus: document.getElementById('ocrStatus'),
            resultsContent: document.getElementById('resultsContent'),
            productTableBody: document.getElementById('productTableBody'),
            historyList: document.getElementById('historyList'),
            clearAllBtn: document.getElementById('clearAll'),
            backendUrl: document.getElementById('backendUrl')
        };
        
        this.queryHistory = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    updateBackendStatus(status) {
        const element = this.elements.backendStatus;
        element.textContent = status;
        element.className = 'status-value';
        
        if (status === 'Connected') {
            element.style.background = '#c6f6d5';
            element.style.color = '#22543d';
        } else {
            element.style.background = '#fed7d7';
            element.style.color = '#742a2a';
        }
    }

    updateOCRStatus(status) {
        const element = this.elements.ocrStatus;
        element.textContent = status;
        element.className = 'status-value';
        
        if (status === 'Ready') {
            element.style.background = '#c6f6d5';
            element.style.color = '#22543d';
        } else {
            element.style.background = '#fed7d7';
            element.style.color = '#742a2a';
        }
    }

    updateQueryHistory(history) {
        const historyList = this.elements.historyList;
        
        if (!history || history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-clock"></i>
                    <p>No recent queries</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-query">${this.truncateText(item.query, 40)}</div>
                <div class="history-details">
                    <span class="history-time">${this.formatTime(item.timestamp)}</span>
                    <span class="history-count">${item.response_count || 0}</span>
                </div>
            </div>
        `).join('');
    }

    updateResults(data) {
        const resultsDiv = this.elements.resultsContent;
        
        if (!data || !data.products || data.products.length === 0) {
            resultsDiv.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h4>No Results Found</h4>
                    <p>${data?.response || 'Try a different image'}</p>
                </div>
            `;
            return;
        }
        
        resultsDiv.innerHTML = `
            <div class="results-item">
                <div class="results-header">
                    <div class="results-query">Query: "${data.original_query || 'Image query'}"</div>
                    <div class="results-time">${new Date().toLocaleTimeString()}</div>
                </div>
                <div class="results-response">${data.response}</div>
                <div class="results-stats">
                    Found ${data.products.length} product(s)
                </div>
            </div>
        `;
    }

    updateProductTable(products) {
        const tableBody = this.elements.productTableBody;
        
        if (!products || products.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">
                        <i class="fas fa-box-open"></i>
                        <p>No products to display</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = products.map((product, index) => `
            <tr>
                <td style="text-align: center;">
                    <i class="fas fa-box" style="color: #667eea;"></i>
                </td>
                <td><strong>${product.name}</strong></td>
                <td>
                    <span class="price-tag">${product.price}</span>
                </td>
                <td>
                    <span class="category-badge">${product.category}</span>
                </td>
                <td>
                    <span class="stock-badge ${product.stock > 10 ? 'in-stock' : 'low-stock'}">
                        ${product.stock} in stock
                    </span>
                </td>
                <td>
                    <button class="btn-view" onclick="viewProduct(${index})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Add some CSS for badges
        this.addBadgeStyles();
    }

    addBadgeStyles() {
        if (!document.getElementById('badge-styles')) {
            const style = document.createElement('style');
            style.id = 'badge-styles';
            style.textContent = `
                .price-tag {
                    background: #c6f6d5;
                    color: #22543d;
                    padding: 0.3rem 0.8rem;
                    border-radius: 12px;
                    font-weight: 600;
                }
                .category-badge {
                    background: #bee3f8;
                    color: #2c5282;
                    padding: 0.3rem 0.8rem;
                    border-radius: 12px;
                    font-size: 0.9rem;
                }
                .stock-badge {
                    padding: 0.3rem 0.8rem;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                .stock-badge.in-stock {
                    background: #c6f6d5;
                    color: #22543d;
                }
                .stock-badge.low-stock {
                    background: #fed7d7;
                    color: #742a2a;
                }
                .btn-view {
                    background: #4299e1;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    transition: all 0.3s ease;
                }
                .btn-view:hover {
                    background: #3182ce;
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(style);
        }
    }

    showLoading(message = 'Processing...') {
        const resultsDiv = this.elements.resultsContent;
        resultsDiv.innerHTML = `
            <div class="loading-state">
                <div class="loading" style="width: 40px; height: 40px; margin: 0 auto 1rem;"></div>
                <p>${message}</p>
            </div>
        `;
    }

    showError(message) {
        if (typeof toastr !== 'undefined') {
            toastr.error(message);
        } else {
            const resultsDiv = this.elements.resultsContent;
            resultsDiv.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle" style="color: #f56565; font-size: 3rem;"></i>
                    <h4>Error</h4>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    clearAll() {
        imageProcessor.clearImage();
        this.elements.resultsContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h4>No Results Yet</h4>
                <p>Upload an image to search for products</p>
            </div>
        `;
        this.elements.productTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <i class="fas fa-box-open"></i>
                    <p>No products to display</p>
                </td>
            </tr>
        `;
        
        if (typeof toastr !== 'undefined') {
            toastr.success('All cleared');
        }
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength 
            ? text.substring(0, maxLength) + '...' 
            : text;
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

export const uiManager = new UIManager();