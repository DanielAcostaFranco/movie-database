const express = require('express');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SALT = process.env.SECRET_SALT || 'cinestream_salt_2024';

// Block access to sensitive files before static middleware
app.use((req, res, next) => {
    const blocked = ['/data/', '/server.js', '/.env', '/node_modules/'];
    if (blocked.some(b => req.path.startsWith(b))) return res.status(403).end();
    next();
});

app.use(express.json());
app.use(express.static('.'));

// ---- HELPERS ----
function getUsers() {
    try {
        return JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    } catch {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function getUserFromToken(token) {
    if (!token) return null;
    const users = getUsers();
    return users.find(u => u.token === token) || null;
}

// ---- MIDDLEWARE ----
function requireAuth(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    const user = getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    req.user = user;
    next();
}

// ---- AUTH ROUTES ----
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const users = getUsers();
    if (users.find(u => u.email === email.toLowerCase())) {
        return res.status(400).json({ error: 'This email is already registered' });
    }

    const token = generateToken();
    const newUser = {
        id: Date.now().toString(),
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashPassword(password),
        token,
        subscription: null,
        watchlist: [],
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    res.json({
        success: true,
        token,
        user: { id: newUser.id, username: newUser.username, email: newUser.email, subscription: null }
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = getUsers();
    const idx = users.findIndex(u => u.email === email.toLowerCase().trim());

    if (idx === -1 || users[idx].password !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    users[idx].token = token;
    saveUsers(users);

    const u = users[idx];
    res.json({
        success: true,
        token,
        user: { id: u.id, username: u.username, email: u.email, subscription: u.subscription }
    });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx !== -1) {
        users[idx].token = null;
        saveUsers(users);
    }
    res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    const { id, username, email, subscription, watchlist } = req.user;
    res.json({ user: { id, username, email, subscription, watchlist: watchlist || [] } });
});

// ---- SUBSCRIPTION ----
app.post('/api/subscribe', requireAuth, (req, res) => {
    const { plan } = req.body || {};
    if (!['basic', 'standard', 'premium'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' });
    }

    const users = getUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    users[idx].subscription = {
        plan,
        startDate: new Date().toISOString(),
        active: true
    };
    saveUsers(users);

    res.json({ success: true, subscription: users[idx].subscription });
});

// ---- WATCHLIST ----
app.get('/api/watchlist', requireAuth, (req, res) => {
    res.json({ watchlist: req.user.watchlist || [] });
});

app.post('/api/watchlist', requireAuth, (req, res) => {
    const { movieId, title, poster } = req.body || {};
    const users = getUsers();
    const idx = users.findIndex(u => u.id === req.user.id);

    if (!users[idx].watchlist.find(m => m.id === movieId)) {
        users[idx].watchlist.push({ id: movieId, title, poster, addedAt: new Date().toISOString() });
        saveUsers(users);
    }

    res.json({ success: true, watchlist: users[idx].watchlist });
});

app.delete('/api/watchlist/:movieId', requireAuth, (req, res) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    users[idx].watchlist = users[idx].watchlist.filter(m => m.id !== req.params.movieId);
    saveUsers(users);
    res.json({ success: true, watchlist: users[idx].watchlist });
});

// ---- MOVIES (TMDB proxy) ----
app.get('/api/movies', async (req, res) => {
    try {
        const { page = 1, search } = req.query;
        const key = process.env.TMDB_API_KEY;
        const url = search
            ? `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(search)}&page=${page}`
            : `https://api.themoviedb.org/3/movie/popular?api_key=${key}&page=${page}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Error fetching movies:', err.message);
        res.status(500).json({ error: 'Failed to fetch movies', results: [] });
    }
});

app.get('/api/movies/:id', async (req, res) => {
    try {
        const key = process.env.TMDB_API_KEY;
        const url = `https://api.themoviedb.org/3/movie/${req.params.id}?api_key=${key}&append_to_response=similar`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Error fetching movie detail:', err.message);
        res.status(500).json({ error: 'Failed to fetch movie' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
