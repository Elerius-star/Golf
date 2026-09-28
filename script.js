// script.js - Complete Frontend for Golf Charity Platform
// Supabase configuration with YOUR actual credentials
const SUPABASE_URL = 'https://yolhgmphqgwntczhucdl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BR7xiEdm5X-hSDLl7dJbeA_tuahhrLG';

// Note: Publishable key is safe to expose in browser
// Secret key is ONLY used in backend (api/index.py)

// Mock current user (will be replaced by real auth)
let currentUser = JSON.parse(localStorage.getItem('golfUser')) || null;

// Charity Data
const charities = [
    { id: 1, name: 'Feeding America', description: 'End hunger in the US', image: '🍎', impact: '1 meal per $1' },
    { id: 2, name: 'Water.org', description: 'Clean water access', image: '💧', impact: '100L per $5' },
    { id: 3, name: 'First Tee', description: 'Youth golf programs', image: '🏌️', impact: 'Equipment for kids' }
];

// Load charities on homepage
function loadCharities() {
    const grid = document.getElementById('charityGrid');
    if (!grid) return;
    grid.innerHTML = charities.map(c => `
        <div class="charity-card">
            <div style="font-size: 3rem;">${c.image}</div>
            <h3>${c.name}</h3>
            <p>${c.description}</p>
            <small>${c.impact}</small>
        </div>
    `).join('');
}

// Score management (localStorage mock - will connect to backend in production)
function saveScore(score, date) {
    let scores = JSON.parse(localStorage.getItem(`scores_${currentUser?.id || 'guest'}`)) || [];
    if (scores.some(s => s.date === date)) {
        alert('Score already exists for this date. Use edit function.');
        return false;
    }
    scores.push({ score: parseInt(score), date, timestamp: Date.now() });
    scores.sort((a,b) => b.timestamp - a.timestamp);
    if (scores.length > 5) scores = scores.slice(0,5);
    localStorage.setItem(`scores_${currentUser?.id || 'guest'}`, JSON.stringify(scores));
    return true;
}

function getScores() {
    return JSON.parse(localStorage.getItem(`scores_${currentUser?.id || 'guest'}`)) || [];
}

// Dashboard specific
if (window.location.pathname.includes('dashboard.html')) {
    displayDashboard();
}

function displayDashboard() {
    const scores = getScores();
    const scoreHtml = scores.map(s => `<li>${s.date}: ${s.score} points</li>`).join('');
    const scoresList = document.getElementById('scoresList');
    if (scoresList) scoresList.innerHTML = scoreHtml || '<li>No scores yet</li>';
    
    const subStatus = document.getElementById('subStatus');
    if (subStatus) subStatus.innerText = currentUser ? 'Active until 2025-05-01' : 'No active subscription';
    
    const charityDisplay = document.getElementById('charityDisplay');
    if (charityDisplay) charityDisplay.innerText = currentUser?.charity || 'Not selected';
    
    const contributionPct = document.getElementById('contributionPct');
    if (contributionPct) contributionPct.innerText = currentUser?.charityPct || '10%';
}

// Auth & subscription
function subscribe(plan) {
    if (!currentUser) {
        alert('Please sign up first (demo: use any email/password)');
        localStorage.setItem('golfUser', JSON.stringify({ id: 'demo123', email: 'demo@test.com', charity: 'Water.org', charityPct: 15 }));
        currentUser = JSON.parse(localStorage.getItem('golfUser'));
        alert('Demo account created! In production, Stripe would process payment.');
    } else {
        alert(`Subscription to ${plan} plan successful! (Demo mode)`);
    }
    if (window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCharities();
    
    const subscribeBtns = ['subscribeBtnNav', 'subscribeHeroBtn', 'subscribeFooterBtn'];
    subscribeBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => subscribe('monthly'));
    });
    
    const scoreForm = document.getElementById('scoreForm');
    if (scoreForm) {
        scoreForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const scoreInput = document.getElementById('scoreInput');
            const dateInput = document.getElementById('dateInput');
            const score = scoreInput?.value;
            const date = dateInput?.value;
            if (score < 1 || score > 45) alert('Score must be 1-45 Stableford');
            else if (saveScore(score, date)) {
                alert('Score saved!');
                displayDashboard();
                if (scoreInput) scoreInput.value = '';
                if (dateInput) dateInput.value = '';
            }
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('golfUser');
            window.location.href = 'index.html';
        });
    }
    
    const changeCharityBtn = document.getElementById('changeCharityBtn');
    if (changeCharityBtn) {
        changeCharityBtn.addEventListener('click', () => {
            let newCharity = prompt('Enter charity name: Water.org, Feeding America, First Tee');
            if (newCharity) {
                currentUser = currentUser || {};
                currentUser.charity = newCharity;
                localStorage.setItem('golfUser', JSON.stringify(currentUser));
                displayDashboard();
                alert(`Charity changed to ${newCharity} (demo)`);
            }
        });
    }
});

window.getScores = getScores;