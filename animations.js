// animations.js - Advanced animations for Toyota Chat

class ChatAnimations {
    constructor() {
        this.observers = [];
        this.initObservers();
    }
    
    initObservers() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });
        
        this.observers.push(observer);
    }
    
    animateMessageSend(element) {
        element.classList.add('message-sent-animation');
        setTimeout(() => {
            element.classList.remove('message-sent-animation');
        }, 500);
    }
    
    animateNewMessage(element) {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = 'messagePop 0.5s ease-out';
    }
    
    createTypingAnimation(container) {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(indicator);
        return indicator;
    }
    
    async pageTransition(callback) {
        document.body.classList.add('page-transition');
        await this.sleep(300);
        callback();
        await this.sleep(300);
        document.body.classList.remove('page-transition');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    createRippleEffect(event, element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${event.clientX - rect.left - size/2}px;
            top: ${event.clientY - rect.top - size/2}px;
            background: radial-gradient(circle, 
                rgba(255,255,255,0.5) 0%, 
                transparent 70%);
        `;
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    animateCount(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 10);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = Math.round(current);
            
            if (current >= end) {
                element.textContent = end;
                clearInterval(timer);
            }
        }, 10);
    }
    
    createShineEffect(element) {
        element.classList.add('shine-effect');
        setTimeout(() => {
            element.classList.remove('shine-effect');
        }, 2000);
    }
    
    parallaxBackground(element, mouseX, mouseY) {
        const rect = element.getBoundingClientRect();
        const x = (mouseX - rect.left) / rect.width - 0.5;
        const y = (mouseY - rect.top) / rect.height - 0.5;
        
        element.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
    }
    
    createParticleExplosion(x, y, color) {
        const particles = 20;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            
            const angle = (i / particles) * Math.PI * 2;
            const velocity = 5 + Math.random() * 5;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 4px;
                height: 4px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
            `;
            
            document.body.appendChild(particle);
            
            let posX = x;
            let posY = y;
            let vY = vy;
            let gravity = 0.2;
            
            const animate = () => {
                posX += vx;
                posY += vY;
                vY += gravity;
                
                particle.style.left = posX + 'px';
                particle.style.top = posY + 'px';
                particle.style.opacity -= 0.02;
                
                if (particle.style.opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };
            
            animate();
        }
    }
    
    createWaveEffect(element) {
        const wave = document.createElement('div');
        wave.className = 'wave-effect';
        element.appendChild(wave);
        
        setTimeout(() => {
            wave.remove();
        }, 1000);
    }
    
    slideInFromLeft(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(-50px)';
        element.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        }, delay);
    }
    
    fadeInUp(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    }
    
    zoomIn(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.5)';
        element.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
        }, delay);
    }
    
    rotateIn(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'rotate(-180deg) scale(0.5)';
        element.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'rotate(0) scale(1)';
        }, delay);
    }
    
    bounceIn(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.3)';
        element.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
        }, delay);
    }
    
    createGradientShift(element, colors) {
        let currentIndex = 0;
        
        setInterval(() => {
            currentIndex = (currentIndex + 1) % colors.length;
            element.style.background = `linear-gradient(135deg, 
                ${colors[currentIndex]} 0%, 
                ${colors[(currentIndex + 1) % colors.length]} 50%, 
                ${colors[(currentIndex + 2) % colors.length]} 100%)`;
        }, 3000);
    }
}

// Initialize animations
const chatAnimations = new ChatAnimations();