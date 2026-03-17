async function moviesInHtml(movies) {
    const container = document.getElementById('movies-container');
    container.innerHTML = ''; // Clear previous content

    movies.forEach(movie => {
        const movieElement = document.createElement('div');
        movieElement.classList.add('movie');
        movieElement.innerHTML = `
            <h2>${movie.title}</h2>
            <p>${movie.overview}</p>
            <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title} poster">
        `;
        container.appendChild(movieElement);
    });
}

