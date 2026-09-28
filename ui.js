// ui.js - Enhanced UI management with Toyota styling

class ToyotaUI {
    constructor() {
        this.currentTooltip = null;
        this.initUI();
        this.createParticles();
        this.setupEventListeners(); // Now this method exists
        this.initTheme();
    }
    
    setupEventListeners() {
        // Setup window resize listener
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Setup scroll listeners
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.addEventListener('scroll', () => {
                this.handleScroll();
            });
        }
    }
    
    handleResize() {
        // Handle responsive behavior
        if (window.innerWidth > 768) {
            document.querySelector('.sidebar')?.classList.remove('open');
        }
    }
    
    handleScroll() {
        // Handle scroll events (like loading more messages)
        const container = document.getElementById('messagesContainer');
        if (container && container.scrollTop === 0) {
            // Load more messages
            console.log('Load more messages');
        }
    }
    
    initUI() {
        // Add mobile menu button
        this.addMobileMenuButton();
        
        // Add loading screen
        this.createLoadingScreen();
        
        // Initialize tooltips
        this.initTooltips();
        
        // Add keyboard shortcuts
        this.initKeyboardShortcuts();
        
        // Add animated background
        this.createAnimatedBackground();
    }
    
    initTheme() {
        // Apply Toyota theme colors
        document.documentElement.style.setProperty('--green', '#2e7d32');
        document.documentElement.style.setProperty('--purple', '#6a1b9a');
        document.documentElement.style.setProperty('--navy-blue', '#1a237e');
        document.documentElement.style.setProperty('--dark-bg', '#0a0a0a');
    }
    
    addMobileMenuButton() {
        // Check if button already exists
        if (document.querySelector('.mobile-menu-btn')) return;
        
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        menuBtn.onclick = () => {
            document.querySelector('.sidebar')?.classList.toggle('open');
        };
        document.body.appendChild(menuBtn);
        
        // Hide on desktop
        if (window.innerWidth > 768) {
            menuBtn.style.display = 'none';
        } else {
            menuBtn.style.display = 'block';
        }
    }
    
    createLoadingScreen() {
        // Check if loading screen already exists
        if (document.querySelector('.loading-screen')) return;
        
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen';
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <img src="assets/logo-animation.svg" alt="Toyota" class="loading-logo logo-animated" onerror="this.src='assets/toyota-logo.svg'">
                <div class="toyota-spinner"></div>
                <p class="loading-text gradient-flow">Connecting to Toyota Chat...</p>
                <div class="loading-progress">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
        `;
        document.body.appendChild(loadingScreen);
        
        // Animate loading progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.remove();
                    }, 500);
                }, 500);
            }
        }, 200);
    }
    
    createAnimatedBackground() {
        const container = document.querySelector('.app-container');
        if (container) {
            container.style.background = 'linear-gradient(135deg, var(--navy-blue), var(--purple))';
            container.style.backgroundSize = 'cover';
        }
    }
    
    createParticles() {
        const container = document.querySelector('.app-container');
        if (!container) return;
        
        const particles = 30;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 4 + 1;
            const left = Math.random() * 100;
            const delay = Math.random() * 15;
            const duration = Math.random() * 8 + 5;
            
            const colors = ['#2e7d32', '#6a1b9a', '#1a237e'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${left}%;
                bottom: -10%;
                background: ${color};
                border-radius: 50%;
                position: fixed;
                animation: floatUp ${duration}s linear ${delay}s infinite;
                opacity: 0.3;
                box-shadow: 0 0 10px ${color};
                pointer-events: none;
                z-index: 0;
            `;
            
            container.appendChild(particle);
        }
    }
    
    initTooltips() {
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }
    
    showTooltip(element, text) {
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.cssText = `
            position: fixed;
            top: ${rect.top - 35}px;
            left: ${rect.left + rect.width / 2}px;
            transform: translateX(-50%);
            background: var(--green);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 10000;
            animation: fadeIn 0.2s;
            white-space: nowrap;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
    }
    
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                document.querySelector('#messageInput')?.focus();
            }
            
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                if (typeof window.createRoom === 'function') window.createRoom();
            }
            
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                if (typeof window.toggleNotifications === 'function') window.toggleNotifications();
            }
            
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (typeof window.toggleSound === 'function') window.toggleSound();
            }
            
            if (e.key === 'Escape') {
                document.querySelector('.sidebar')?.classList.remove('open');
            }
        });
    }
    
    createToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, duration);
    }
}

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.toyotaUI = new ToyotaUI();
});

// Add CSS animations if not already present
if (!document.getElementById('toyota-ui-styles')) {
    const style = document.createElement('style');
    style.id = 'toyota-ui-styles';
    style.textContent = `
        @keyframes floatUp {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 0.3;
            }
            100% {
                transform: translateY(-120vh) rotate(360deg);
                opacity: 0;
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, var(--navy-blue), var(--purple));
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            transition: opacity 0.5s;
        }
        
        .loading-content {
            text-align: center;
        }
        
        .loading-logo {
            width: 150px;
            height: 150px;
            margin-bottom: 30px;
            animation: pulse 2s infinite;
        }
        
        .toyota-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid transparent;
            border-top-color: var(--green);
            border-right-color: var(--purple);
            border-bottom-color: var(--navy-blue);
            border-radius: 50%;
            margin: 20px auto;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: white;
            font-size: 18px;
            margin: 20px 0;
        }
        
        .gradient-flow {
            background: linear-gradient(270deg, var(--green), var(--purple), var(--navy-blue));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 300% 100%;
            animation: gradientFlow 3s ease infinite;
        }
        
        @keyframes gradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .loading-progress {
            width: 300px;
            height: 4px;
            background: rgba(255,255,255,0.2);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 20px;
        }
        
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, var(--green), var(--purple));
            transition: width 0.2s;
        }
        
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--dark-bg);
            border: 1px solid var(--green);
            border-radius: 10px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            z-index: 10001;
            animation: slideUp 0.3s;
        }
        
        @keyframes slideUp {
            from {
                transform: translate(-50%, 100%);
                opacity: 0;
            }
            to {
                transform: translate(-50%, 0);
                opacity: 1;
            }
        }
        
        .toast-close {
            background: transparent;
            border: none;
            color: var(--text-gray);
            cursor: pointer;
            padding: 0 5px;
            font-size: 16px;
        }
        
        .toast-close:hover {
            color: var(--text-light);
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        .mobile-menu-btn {
            display: none;
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 1001;
            background: var(--green);
            color: white;
            border: none;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        @media (max-width: 768px) {
            .mobile-menu-btn {
                display: block;
            }
        }
    `;
    document.head.appendChild(style);
}