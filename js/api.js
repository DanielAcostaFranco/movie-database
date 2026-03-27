let currentPage = 1;
let currentSearch = '';

async function loadMovies(page = 1, search = '') {
    const container = document.getElementById('movies-container');
    container.innerHTML = '<div class="loading" style="grid-column:1/-1;"><div class="spinner"></div><p>Loading...</p></div>';

    let url = `/api/movies?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await fetch(url);
    const data = await response.json();
    moviesInHtml(data.results || []);
    renderPagination(Math.min(data.total_pages || 1, 20), page);
}

function renderPagination(totalPages, current) {
    const pagination = document.getElementById('pagination');
    if (!pagination || totalPages <= 1) { if (pagination) pagination.innerHTML = ''; return; }

    let html = '';
    if (current > 1) html += `<button onclick="goToPage(${current - 1})">← Previous</button>`;

    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);
    for (let i = start; i <= end; i++) {
        html += `<button class="${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (current < totalPages) html += `<button onclick="goToPage(${current + 1})">Next →</button>`;
    pagination.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadMovies(page, currentSearch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

(async () => {
    const user = await getCurrentUser();
    await renderNavbar(user);

    // Read search query from URL (e.g. /?search=avengers)
    const params = new URLSearchParams(window.location.search);
    currentSearch = params.get('search') || '';

    const title = document.getElementById('section-title');
    if (currentSearch) {
        if (title) title.textContent = `Results for "${currentSearch}"`;
        // Pre-fill the navbar search box
        const navInput = document.getElementById('nav-search-input');
        if (navInput) navInput.value = currentSearch;
    }

    loadMovies(1, currentSearch);
})();
