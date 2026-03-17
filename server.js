const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.static('.'));


// Proxy route to fetch data from TMDB API
app.get('/api/movies', async (req, res) => {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

