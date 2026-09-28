// theme-manager.js - Dynamic theme management

class ThemeManager {
    constructor() {
        this.themes = {
            default: {
                name: 'Toyota Classic',
                colors: {
                    primary: '#2e7d32',
                    secondary: '#6a1b9a',
                    accent: '#1a237e',
                    background: '#0a0a0a',
                    text: '#ffffff'
                }
            },
            sports: {
                name: 'Toyota Racing',
                colors: {
                    primary: '#ff6b00',
                    secondary: '#333333',
                    accent: '#c0c0c0',
                    background: '#1a1a1a',
                    text: '#ffffff'
                }
            },
            luxury: {
                name: 'Toyota Luxury',
                colors: {
                    primary: '#d4af37',
                    secondary: '#8b4513',
                    accent: '#4a2c2c',
                    background: '#2c1810',
                    text: '#f5e6d3'
                }
            }
        };
        
        this.currentTheme = localStorage.getItem('toyota-theme') || 'default';
        this.init();
    }
    
    init() {
        this.loadTheme(this.currentTheme);
        this.createThemeSwitcher();
    }
    
    loadTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;
        
        const root = document.documentElement;
        root.style.setProperty('--green', theme.colors.primary);
        root.style.setProperty('--purple', theme.colors.secondary);
        root.style.setProperty('--navy-blue', theme.colors.accent);
        root.style.setProperty('--dark-bg', theme.colors.background);
        
        // Save preference
        localStorage.setItem('toyota-theme', themeName);
        this.currentTheme = themeName;
    }
    
    createThemeSwitcher() {
        // Check if switcher already exists
        if (document.querySelector('.theme-switcher')) return;
        
        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
            <button class="theme-toggle-btn" id="themeToggleBtn">
                <i class="fas fa-palette"></i>
            </button>
            <div class="theme-panel" id="themePanel">
                <h4>Choose Theme</h4>
                <div class="theme-grid">
                    ${Object.entries(this.themes).map(([key, theme]) => `
                        <div class="theme-option ${key === this.currentTheme ? 'active' : ''}" 
                             data-theme="${key}">
                            <div class="theme-preview" style="
                                background: linear-gradient(135deg, 
                                    ${theme.colors.primary} 0%, 
                                    ${theme.colors.secondary} 50%, 
                                    ${theme.colors.accent} 100%);
                            "></div>
                            <span>${theme.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(switcher);
        
        // Add event listeners
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            document.getElementById('themePanel').classList.toggle('visible');
        });
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeName = option.dataset.theme;
                this.loadTheme(themeName);
                document.getElementById('themePanel').classList.remove('visible');
                
                // Update active state
                document.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
            });
        });
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Add theme switcher styles if not present
if (!document.getElementById('theme-switcher-styles')) {
    const style = document.createElement('style');
    style.id = 'theme-switcher-styles';
    style.textContent = `
        .theme-switcher {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
        }
        
        .theme-toggle-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--green);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s;
        }
        
        .theme-toggle-btn:hover {
            transform: scale(1.1) rotate(30deg);
        }
        
        .theme-panel {
            position: absolute;
            bottom: 60px;
            right: 0;
            width: 280px;
            background: var(--dark-bg);
            border: 1px solid var(--green);
            border-radius: 10px;
            padding: 15px;
            display: none;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        
        .theme-panel.visible {
            display: block;
            animation: fadeIn 0.3s;
        }
        
        .theme-panel h4 {
            color: var(--green);
            margin-bottom: 15px;
            text-align: center;
        }
        
        .theme-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .theme-option {
            cursor: pointer;
            padding: 10px;
            border-radius: 5px;
            transition: all 0.3s;
            text-align: center;
        }
        
        .theme-option:hover {
            background: rgba(255,255,255,0.1);
            transform: translateY(-2px);
        }
        
        .theme-option.active {
            border: 2px solid var(--green);
        }
        
        .theme-preview {
            width: 100%;
            height: 60px;
            border-radius: 5px;
            margin-bottom: 5px;
        }
        
        .theme-option span {
            font-size: 12px;
            color: var(--text-light);
        }
    `;
    document.head.appendChild(style);
}