// Image Processing Module - Handles image uploads and previews
class ImageProcessor {
    constructor() {
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/gif'];
        this.currentImage = null;
        this.elements = {
            uploadArea: document.getElementById('uploadArea'),
            imageInput: document.getElementById('imageInput'),
            imagePreview: document.getElementById('imagePreview'),
            selectedImage: document.getElementById('selectedImage'),
            previewContainer: document.getElementById('previewContainer'),
            processButton: document.getElementById('processImage'),
            clearButton: document.getElementById('clearImage'),
            imageName: document.getElementById('imageName'),
            imageSize: document.getElementById('imageSize'),
            extractedText: document.getElementById('extractedText')
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Drag and drop events
        this.elements.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // File input change
        this.elements.imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Clear buttons
        this.elements.clearButton.addEventListener('click', () => this.clearImage());
        
        // Process button
        this.elements.processButton.addEventListener('click', () => this.processImage());
        
        // Click on upload area to open file dialog
        this.elements.uploadArea.addEventListener('click', (e) => {
            if (e.target !== this.elements.imageInput) {
                this.elements.imageInput.click();
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.validateAndProcessFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.validateAndProcessFile(files[0]);
        }
    }

    validateAndProcessFile(file) {
        // Validate file type
        if (!this.allowedTypes.includes(file.type)) {
            this.showError(`Invalid file type. Allowed: ${this.allowedTypes.join(', ')}`);
            return;
        }
        
        // Validate file size
        if (file.size > this.maxFileSize) {
            this.showError(`File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
            return;
        }
        
        // Process valid file
        this.currentImage = file;
        this.displayImagePreview(file);
        this.updateImageInfo(file);
        this.enableProcessButton();
    }

    displayImagePreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.elements.selectedImage.src = e.target.result;
            this.elements.previewContainer.classList.add('active');
            
            // Show preview in upload area
            this.elements.imagePreview.innerHTML = `
                <div class="mini-preview">
                    <img src="${e.target.result}" alt="Preview">
                    <div class="preview-overlay">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            `;
        };
        
        reader.readAsDataURL(file);
    }

    updateImageInfo(file) {
        this.elements.imageName.textContent = file.name;
        this.elements.imageSize.textContent = `Size: ${this.formatFileSize(file.size)}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    enableProcessButton() {
        this.elements.processButton.disabled = false;
        this.elements.processButton.innerHTML = '<i class="fas fa-cogs"></i> Process Image & Search';
    }

    disableProcessButton() {
        this.elements.processButton.disabled = true;
    }

    async processImage() {
        if (!this.currentImage) {
            this.showError('Please select an image first');
            return;
        }
        
        // Show processing state
        this.disableProcessButton();
        this.elements.processButton.innerHTML = '<div class="loading"></div> Processing...';
        
        // Dispatch event for main app to handle
        const event = new CustomEvent('imageProcessing', {
            detail: { 
                image: this.currentImage,
                imageUrl: URL.createObjectURL(this.currentImage)
            }
        });
        document.dispatchEvent(event);
    }

    clearImage() {
        this.currentImage = null;
        this.elements.selectedImage.src = '';
        this.elements.previewContainer.classList.remove('active');
        this.elements.imagePreview.innerHTML = '';
        this.elements.imageName.textContent = 'No image selected';
        this.elements.imageSize.textContent = 'Size: 0 KB';
        this.elements.extractedText.innerHTML = '<p class="placeholder">Text will appear here after image processing...</p>';
        this.disableProcessButton();
        
        // Reset file input
        this.elements.imageInput.value = '';
        
        // Show toast notification
        if (typeof toastr !== 'undefined') {
            toastr.info('Image cleared');
        }
    }

    updateExtractedText(text) {
        this.elements.extractedText.innerHTML = `
            <div class="extracted-text-content">
                <strong>Extracted Text:</strong>
                <p>${text || 'No text could be extracted from the image'}</p>
            </div>
        `;
    }

    showError(message) {
        if (typeof toastr !== 'undefined') {
            toastr.error(message);
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        if (typeof toastr !== 'undefined') {
            toastr.success(message);
        } else {
            alert(message);
        }
    }

    resetProcessButton() {
        this.elements.processButton.disabled = false;
        this.elements.processButton.innerHTML = '<i class="fas fa-cogs"></i> Process Image & Search';
    }
}

export const imageProcessor = new ImageProcessor();