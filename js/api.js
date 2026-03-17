async function getPopularMovies() {
    const response = await fetch('/api/movies');
    const data = await response.json();
    moviesInHtml(data.results);
}

getPopularMovies();