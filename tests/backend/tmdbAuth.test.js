import mongoose from 'mongoose';
import { app } from '../../backend/server.js';
import tmdbService from '../../backend/services/tmdbService.js';

describe('TMDB Authentication & Configuration Tests', () => {
  let server;
  let baseUrl = '';

  const validV3Key = process.env.TMDB_API_KEY || 'a2f022c808031b695ead540577b6bd91';
  const validV4Token = process.env.TMDB_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMmYwMjJjODA4MDMxYjY5NWVhZDU0MDU3N2I2YmQ5MSIsIm5iZiI6MTc5NDEyMDc2NC4zMDMsInN1YiI6IjZhZjAxYzNjZjYzZWQzMTY0OTBkM2ZiNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.G404U7WIT47jYkxFjoOzDVPJVZ939UGr_VGUa5aWKmA';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_movie_rec_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
  });

  describe('Unit: tmdbService Auth Resolution & Headers', () => {
    it('should never send an empty or undefined Authorization header', () => {
      // Temporarily clear tokens
      const origToken = tmdbService.readAccessToken;
      const origKey = tmdbService.apiKey;

      tmdbService.readAccessToken = '';
      tmdbService.apiKey = 'test_v3_key';

      const headersV3 = tmdbService.buildHeaders();
      expect(headersV3.Authorization).toBeUndefined();
      expect(headersV3['Content-Type']).toBe('application/json');

      tmdbService.readAccessToken = validV4Token;
      const headersV4 = tmdbService.buildHeaders();
      expect(headersV4.Authorization).toBe(`Bearer ${validV4Token}`);

      // Restore
      tmdbService.readAccessToken = origToken;
      tmdbService.apiKey = origKey;
    });

    it('should prefer v4 Bearer Token when both credentials are present', () => {
      const origToken = tmdbService.readAccessToken;
      const origKey = tmdbService.apiKey;
      const origMethod = tmdbService.authMethod;

      tmdbService.authMethod = 'auto';
      tmdbService.readAccessToken = 'eyJ_sample_bearer_token_value_here';
      tmdbService.apiKey = 'sample_v3_key_32chars_long_123';

      expect(tmdbService.resolveAuthMethod()).toBe('v4');

      // When only v3 is set
      tmdbService.readAccessToken = '';
      expect(tmdbService.resolveAuthMethod()).toBe('v3');

      // When neither is set
      tmdbService.apiKey = '';
      expect(tmdbService.resolveAuthMethod()).toBeNull();

      // Restore
      tmdbService.readAccessToken = origToken;
      tmdbService.apiKey = origKey;
      tmdbService.authMethod = origMethod;
    });
  });

  describe('Integration: /api/movies/config-key & /api/movies/status', () => {
    it('1. GET /api/movies/status returns system credential state', async () => {
      const res = await fetch(`${baseUrl}/api/movies/status`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('hasApiKey');
      expect(data).toHaveProperty('hasCredentials');
      expect(data).toHaveProperty('authMethod');
    });

    it('2. POST /api/movies/config-key without auth header should NOT return 401 JWT error', async () => {
      // Prior bug: Unauthenticated users got 401 "Authentication required. No access token provided."
      // Now: Should accept request, and return 400 if body is empty
      const res = await fetch(`${baseUrl}/api/movies/config-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toMatch(/provide at least one credential/i);
    });

    it('3. POST /api/movies/config-key with invalid credential returns 401 TMDB verification error', async () => {
      const res = await fetch(`${baseUrl}/api/movies/config-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: 'invalid_fake_key_99999999999999',
          authMethod: 'v3',
        }),
      });

      // TMDB returns 401 for invalid keys
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toMatch(/TMDB API verification failed|Invalid.*TMDB|Invalid API key/i);
    });

    it('4. POST /api/movies/config-key with real TMDB v4 Read Access Token verifies live', async () => {
      const res = await fetch(`${baseUrl}/api/movies/config-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readAccessToken: validV4Token,
          authMethod: 'v4',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.authMethod).toBe('v4');
      expect(data.details).toBeDefined();
      expect(data.details.testMovie).toBeDefined();
    }, 15000);

    it('5. POST /api/movies/config-key with real TMDB v3 API Key verifies live', async () => {
      const res = await fetch(`${baseUrl}/api/movies/config-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: validV3Key,
          authMethod: 'v3',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.authMethod).toBe('v3');
      expect(data.details).toBeDefined();
      expect(data.details.testMovie).toBeDefined();
    }, 15000);
  });
});
