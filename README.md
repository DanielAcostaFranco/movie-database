# Movie Database App

This is a simple movie website.
You can:
- create an account
- log in
- see movie lists
- open movie details
- subscribe
- save movies in your watchlist

## Tech used
- HTML
- CSS
- JavaScript
- Node.js
- Express

## Requirements
- Node.js installed

## Setup
1. Open the project folder.
2. Install dependencies:

```bash
npm install
```

3. Create a file named `.env` in the project root.
4. Add your TMDB API key:

```env
TMDB_API_KEY=your_tmdb_api_key_here
SECRET_SALT=your_secret_text
PORT=3000
```

## Run the app
Start the server with:

```bash
node server.js
```

Then open:
- http://localhost:3000

## Main files
- `index.html`: home page
- `login.html`: login page
- `register.html`: register page
- `profile.html`: user profile
- `movie-detail.html`: movie detail page
- `server.js`: backend API and static server

## Notes
- User data is saved in `data/users.json`.
- Plans are in `data/plans.json`.
- Do not share your `.env` file.
