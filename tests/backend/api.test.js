import mongoose from 'mongoose';
import { app } from '../../backend/server.js';
import { User, MovieCache, Watchlist, Favorite, Rating, Review } from '../../backend/models/index.js';

describe('Backend API & Database Integration Tests', () => {
  let server;
  let baseUrl = '';
  let authToken = '';
  let userId = '';
  const testEmail = `tester_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_movie_rec_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Start server on random available port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Seed movie
    await MovieCache.findOneAndUpdate(
      { tmdbId: 157336 },
      {
        $set: {
          tmdbId: 157336,
          title: 'Interstellar',
          overview: 'Mankind was born on Earth. It was never meant to die here.',
          genres: [{ id: 878, name: 'Science Fiction' }, { id: 18, name: 'Drama' }],
          voteAverage: 8.4,
          voteCount: 34000,
          popularity: 120.5,
          releaseDate: '2014-11-05',
          releaseYear: 2014,
          featureString: 'Science Fiction Drama Christopher Nolan Matthew McConaughey black hole space',
        },
      },
      { upsert: true }
    );
  });

  afterAll(async () => {
    if (userId) {
      await User.findByIdAndDelete(userId);
      await Watchlist.deleteMany({ userId });
      await Favorite.deleteMany({ userId });
      await Rating.deleteMany({ userId });
      await Review.deleteMany({ userId });
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
  });

  it('1. POST /api/auth/register should register a new user and generate OTP', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Explorer',
        email: testEmail,
        password: testPassword,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user).toHaveProperty('id');
    expect(data.tokens).toHaveProperty('accessToken');

    userId = data.user.id;
    authToken = data.tokens.accessToken;
  });

  it('2. POST /api/auth/login should authenticate user and issue JWT tokens', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tokens).toHaveProperty('accessToken');
    authToken = data.tokens.accessToken;
  });

  it('3. GET /api/movies/status should return API status', async () => {
    const res = await fetch(`${baseUrl}/api/movies/status`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('hasApiKey');
  });

  it('4. GET /api/movies/157336 should return cached movie details', async () => {
    const res = await fetch(`${baseUrl}/api/movies/157336`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.title).toBe('Interstellar');
  });

  it('5. POST /api/favorites/toggle should add movie to user favorites', async () => {
    const res = await fetch(`${baseUrl}/api/favorites/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        tmdbId: 157336,
        title: 'Interstellar',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.isFavorite).toBe(true);
  });

  it('6. POST /api/ratings/ratings should persist user rating', async () => {
    const res = await fetch(`${baseUrl}/api/ratings/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        tmdbId: 157336,
        rating: 9,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('7. POST /api/ratings/reviews should create a user review', async () => {
    const res = await fetch(`${baseUrl}/api/ratings/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        tmdbId: 157336,
        title: 'Masterpiece of cinema',
        content: 'Exceptional visual effects, emotion, and score by Hans Zimmer.',
        rating: 10,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.review.title).toBe('Masterpiece of cinema');
  });

  it('8. GET /api/dashboard/analytics should return calculated stats from DB', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/analytics`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.summary.totalFavorites).toBeGreaterThanOrEqual(1);
    expect(data.summary.averageRating).toBeGreaterThanOrEqual(9);
  });

  it('9. GET /api/recommendations/personalized should generate recommendations', async () => {
    const res = await fetch(`${baseUrl}/api/recommendations/personalized`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('10. POST /api/ai/chat should respond with contextual suggestions', async () => {
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: 'Recommend something like Interstellar',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.response).toHaveProperty('text');
  });

  it('11. DELETE /api/auth/delete-account should delete the user account and associated records', async () => {
    const res = await fetch(`${baseUrl}/api/auth/delete-account`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const deleted = await User.findById(userId);
    expect(deleted).toBeNull();
    userId = null; // Mark cleared so afterAll does not throw
  });
});
