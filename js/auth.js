const TOKEN_KEY = 'cs_token';
const USER_KEY = 'cs_user';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function getAuthHeaders() {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function getCurrentUser() {
    const token = getToken();
    if (!token) return null;
    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) { clearAuth(); return null; }
        const data = await res.json();
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
    } catch {
        return null;
    }
}

async function logout() {
    const token = getToken();
    if (token) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch {}
    }
    clearAuth();
    window.location.href = '/login.html';
}

async function requireAuth(redirect = '/login.html') {
    const user = await getCurrentUser();
    if (!user) { window.location.href = redirect; return null; }
    return user;
}

function handleNavSearch(e) {
    e.preventDefault();
    const query = document.getElementById('nav-search-input')?.value.trim();
    if (!query) { window.location.href = '/'; return; }
    window.location.href = `/?search=${encodeURIComponent(query)}`;
}

async function renderNavbar(user) {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    nav.innerHTML = `
        <div class="nav-brand"><a href="/">Detflix</a></div>
        <form class="nav-search" onsubmit="handleNavSearch(event)">
            <input type="text" id="nav-search-input" placeholder="Search movies...">
            <button type="submit">Search</button>
        </form>
        <div class="nav-links">
            ${user ? '<a href="/profile.html">My Profile</a>' : ''}
        </div>
        <div class="nav-auth">
            ${user ? `
                <span class="nav-username">${user.username}</span>
                ${!user.subscription?.active ? '<a href="/checkout.html" class="btn-subscribe">Subscribe</a>' : ''}
                <button onclick="logout()" class="btn-logout">Sign Out</button>
            ` : `
                <a href="/login.html" class="btn-login">Sign In</a>
                <a href="/register.html" class="btn-register">Sign Up</a>
            `}
        </div>
    `;
}
