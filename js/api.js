let currentPage = 1;
let currentSearch = '';
let currentGenre = '';
let currentSort = '';
let currentDuration = '';

async function loadMovies(page = 1, search = '', genre = '', sort = '', duration = '') {
    const container = document.getElementById('movies-container');
    container.innerHTML = '<div class="loading" style="grid-column:1/-1;"><div class="spinner"></div><p>Loading...</p></div>';

    let url = `/api/movies?page=${page}`;
    if (search)   url += `&search=${encodeURIComponent(search)}`;
    if (genre)    url += `&genre=${encodeURIComponent(genre)}`;
    if (sort)     url += `&sort_by=${encodeURIComponent(sort)}`;
    if (duration) url += `&duration=${encodeURIComponent(duration)}`;

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
    loadMovies(page, currentSearch, currentGenre, currentSort, currentDuration);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSectionTitle() {
    const title = document.getElementById('section-title');
    if (!title) return;
    if (currentSearch) {
        title.textContent = `Results for "${currentSearch}"`;
    } else {
        title.textContent = 'Popular Movies';
    }
}

function syncFiltersToURL() {
    const params = new URLSearchParams();
    if (currentSearch)   params.set('search', currentSearch);
    if (currentGenre)    params.set('genre', currentGenre);
    if (currentSort)     params.set('sort_by', currentSort);
    if (currentDuration) params.set('duration', currentDuration);
    const qs = params.toString();
    history.replaceState(null, '', qs ? `?${qs}` : '/');
}

async function loadGenres() {
    const select = document.getElementById('filter-genre');
    if (!select) return;
    const res = await fetch('/api/genres');
    const data = await res.json();
    (data.genres || []).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        select.appendChild(opt);
    });
}

(async () => {
    const user = await getCurrentUser();
    await renderNavbar(user);

    const params = new URLSearchParams(window.location.search);
    currentSearch   = params.get('search')   || '';
    currentGenre    = params.get('genre')    || '';
    currentSort     = params.get('sort_by')  || '';
    currentDuration = params.get('duration') || '';

    await loadGenres();

    // Restore dropdown states from URL
    const genreEl    = document.getElementById('filter-genre');
    const sortEl     = document.getElementById('filter-sort');
    const durationEl = document.getElementById('filter-duration');

    if (genreEl && currentGenre)       genreEl.value    = currentGenre;
    if (sortEl && currentSort)         sortEl.value     = currentSort;
    if (durationEl && currentDuration) durationEl.value = currentDuration;

    // Pre-fill navbar search
    if (currentSearch) {
        const navInput = document.getElementById('nav-search-input');
        if (navInput) navInput.value = currentSearch;
    }

    // Filter change listeners
    function onFilterChange() {
        currentGenre    = genreEl    ? genreEl.value    : '';
        currentSort     = sortEl     ? sortEl.value     : '';
        currentDuration = durationEl ? durationEl.value : '';
        currentPage = 1;
        syncFiltersToURL();
        updateSectionTitle();
        loadMovies(1, currentSearch, currentGenre, currentSort, currentDuration);
    }

    if (genreEl)    genreEl.addEventListener('change', onFilterChange);
    if (sortEl)     sortEl.addEventListener('change', onFilterChange);
    if (durationEl) durationEl.addEventListener('change', onFilterChange);

    const resetBtn = document.getElementById('filter-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentSearch = ''; currentGenre = ''; currentSort = ''; currentDuration = '';
            if (genreEl)    genreEl.value    = '';
            if (sortEl)     sortEl.value     = '';
            if (durationEl) durationEl.value = '';
            const navInput = document.getElementById('nav-search-input');
            if (navInput) navInput.value = '';
            currentPage = 1;
            syncFiltersToURL();
            updateSectionTitle();
            loadMovies(1);
        });
    }

    updateSectionTitle();
    loadMovies(1, currentSearch, currentGenre, currentSort, currentDuration);
})();
