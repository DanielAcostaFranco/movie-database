function moviesInHtml(movies) {
    const container = document.getElementById('movies-container');

    if (!movies || movies.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="empty-icon">🎬</div>
                <p>No movies found</p>
            </div>`;
        return;
    }

    container.innerHTML = movies.map(movie => {
        const poster = movie.poster_path
            ? `<img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}" loading="lazy">`
            : `<div class="movie-no-poster">No image</div>`;

        const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

        return `
            <a href="/movie-detail.html?id=${movie.id}" class="movie-card">
                ${poster}
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <div class="movie-meta">
                        <span>${year}</span>
                        <span class="rating">★ ${rating}</span>
                    </div>
                </div>
            </a>`;
    }).join('');
}
