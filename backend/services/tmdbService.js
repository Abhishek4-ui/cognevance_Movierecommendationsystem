import https from 'node:https';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MovieCache } from '../models/MovieCache.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMDB_IPS = ['3.175.86.103', '3.175.86.50', '3.175.86.37', '3.175.86.67'];
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

class TmdbService {
  constructor() {
    this.apiKey = (process.env.TMDB_API_KEY || '').trim();
    this.readAccessToken = (process.env.TMDB_ACCESS_TOKEN || '').trim();
    this.authMethod = process.env.TMDB_AUTH_METHOD || 'auto'; // 'auto' | 'v4' | 'v3'
    this.currentIpIndex = 0;
  }

  setCredentials({ apiKey, readAccessToken, authMethod }) {
    if (apiKey !== undefined) this.apiKey = apiKey.trim();
    if (readAccessToken !== undefined) this.readAccessToken = readAccessToken.trim();
    if (authMethod !== undefined) this.authMethod = authMethod;
  }

  getApiKey() {
    if (this.apiKey !== undefined && this.apiKey !== null) {
      return this.apiKey.trim();
    }
    return (process.env.TMDB_API_KEY || '').trim();
  }

  getReadAccessToken() {
    if (this.readAccessToken !== undefined && this.readAccessToken !== null) {
      return this.readAccessToken.trim();
    }
    return (process.env.TMDB_ACCESS_TOKEN || '').trim();
  }

  buildHeaders(overrideToken = null) {
    const token = overrideToken !== null ? overrideToken : this.getReadAccessToken();
    const headers = {
      Host: 'api.themoviedb.org',
      'User-Agent': 'CineAI/1.0',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token && token.trim().length > 0) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    return headers;
  }

  hasCredentials() {
    const v4 = this.getReadAccessToken();
    const v3 = this.getApiKey();
    return Boolean((v4 && v4.length > 20) || (v3 && v3.length > 5));
  }

  hasApiKey() {
    return this.hasCredentials();
  }

  /**
   * Determine whether to use V4 Bearer Token or V3 API Key
   * Requirement 3: Prefer V4 Bearer Token authentication
   */
  resolveAuthMethod() {
    const v4 = this.getReadAccessToken();
    const v3 = this.getApiKey();

    if (this.authMethod === 'v4' && v4) return 'v4';
    if (this.authMethod === 'v3' && v3) return 'v3';

    // Auto mode: Prefer V4 Bearer Token if available, fallback to V3
    if (v4 && v4.length > 20) return 'v4';
    if (v3 && v3.length > 5) return 'v3';

    return null;
  }

  /**
   * Resilient HTTPS fetch directly to TMDB server IP
   * Bypasses ISP DPI blocking / DNS poisoning
   * Never sends an empty Authorization header
   */
  async fetchTmdb(endpoint, params = {}) {
    const method = this.resolveAuthMethod();
    if (!method) {
      const error = new Error('TMDB credentials missing. Please configure TMDB Read Access Token (v4) or API Key (v3) in application settings.');
      error.code = 'MISSING_TMDB_CREDENTIALS';
      error.status = 400;
      throw error;
    }

    const headers = {
      Host: 'api.themoviedb.org',
      'User-Agent': 'CineAI/1.0',
      Accept: 'application/json',
    };

    const queryParams = new URLSearchParams(params);

    // Rule 3 & 4 & 5:
    // If V4: Authorization: Bearer <token>, do NOT send api_key in query params
    // If V3: ?api_key=<key>, do NOT send Authorization header (never send empty Authorization header)
    if (method === 'v4') {
      const token = this.getReadAccessToken();
      if (!token) {
        throw new Error('TMDB v4 Read Access Token is missing.');
      }
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      const key = this.getApiKey();
      if (!key) {
        throw new Error('TMDB v3 API Key is missing.');
      }
      queryParams.append('api_key', key);
    }

    const queryString = queryParams.toString();
    const fullPath = `/3${endpoint}${queryString ? (endpoint.includes('?') ? '&' : '?') + queryString : ''}`;

    let lastError = null;

    // Try primary and backup TMDB IPs
    for (let attempt = 0; attempt < TMDB_IPS.length; attempt++) {
      const targetIp = TMDB_IPS[(this.currentIpIndex + attempt) % TMDB_IPS.length];

      try {
        const result = await new Promise((resolve, reject) => {
          const req = https.request(
            {
              hostname: targetIp,
              port: 443,
              path: fullPath,
              method: 'GET',
              headers,
              rejectUnauthorized: false,
              timeout: 10000,
            },
            (res) => {
              let data = '';
              res.on('data', (chunk) => (data += chunk));
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  try {
                    resolve(JSON.parse(data));
                  } catch (e) {
                    reject(new Error('Failed to parse TMDB JSON response'));
                  }
                } else if (res.statusCode === 401) {
                  const error = new Error('Invalid TMDB credentials. Authentication failed.');
                  error.status = 401;
                  error.code = 'TMDB_UNAUTHORIZED';
                  reject(error);
                } else if (res.statusCode === 429) {
                  const error = new Error('TMDB API rate limit exceeded. Please wait a moment.');
                  error.status = 429;
                  error.code = 'TMDB_RATE_LIMIT';
                  reject(error);
                } else {
                  try {
                    const errObj = JSON.parse(data);
                    const error = new Error(errObj.status_message || `TMDB API error ${res.statusCode}`);
                    error.status = res.statusCode;
                    reject(error);
                  } catch (e) {
                    reject(new Error(`TMDB responded with status ${res.statusCode}`));
                  }
                }
              });
            }
          );

          req.on('timeout', () => {
            req.destroy();
            const err = new Error('TMDB connection timed out. Network connection failed.');
            err.code = 'TMDB_TIMEOUT';
            err.status = 504;
            reject(err);
          });

          req.on('error', (e) => {
            const err = new Error(`Network failure connecting to TMDB: ${e.message}`);
            err.code = 'TMDB_NETWORK_ERROR';
            reject(err);
          });

          req.end();
        });

        return result;
      } catch (err) {
        lastError = err;
        // Don't retry other IPs if it was an explicit 401 or 429
        if (err.status === 401 || err.status === 429) {
          throw err;
        }
      }
    }

    throw lastError || new Error('Failed to reach TMDB API.');
  }

  /**
   * Validate credentials against TMDB before saving
   */
  async verifyCredentials({ apiKey, readAccessToken, authMethod = 'auto' }) {
    const testMethod = authMethod === 'v3' || (!readAccessToken && apiKey) ? 'v3' : 'v4';

    if (testMethod === 'v4' && (!readAccessToken || readAccessToken.trim().length < 20)) {
      const err = new Error('Please provide a valid TMDB API Read Access Token (v4).');
      err.status = 400;
      throw err;
    }

    if (testMethod === 'v3' && (!apiKey || apiKey.trim().length < 5)) {
      const err = new Error('Please provide a valid TMDB API Key (v3).');
      err.status = 400;
      throw err;
    }

    const headers = {
      Host: 'api.themoviedb.org',
      'User-Agent': 'CineAI/1.0',
      Accept: 'application/json',
    };

    let testPath = '/3/movie/popular';

    if (testMethod === 'v4') {
      headers['Authorization'] = `Bearer ${readAccessToken.trim()}`;
    } else {
      testPath += `?api_key=${encodeURIComponent(apiKey.trim())}`;
    }

    const targetIp = TMDB_IPS[0];

    const result = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: targetIp,
          port: 443,
          path: testPath,
          method: 'GET',
          headers,
          rejectUnauthorized: false,
          timeout: 10000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error('Failed to parse TMDB response'));
              }
            } else if (res.statusCode === 401) {
              const err = new Error(
                testMethod === 'v4'
                  ? 'Invalid TMDB Read Access Token (v4). TMDB rejected this token.'
                  : 'Invalid TMDB API Key (v3). TMDB rejected this key.'
              );
              err.status = 401;
              reject(err);
            } else if (res.statusCode === 429) {
              const err = new Error('TMDB API rate limit exceeded.');
              err.status = 429;
              reject(err);
            } else {
              const err = new Error(`TMDB verification returned status ${res.statusCode}`);
              err.status = res.statusCode;
              reject(err);
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        const err = new Error('TMDB connection timed out.');
        err.status = 504;
        reject(err);
      });

      req.on('error', (e) => {
        const err = new Error(`Network failure connecting to TMDB: ${e.message}`);
        reject(err);
      });

      req.end();
    });

    return {
      success: true,
      authMethod: testMethod,
      totalResults: result.total_results,
      sampleMovie: result.results?.[0]?.title || 'Verified',
    };
  }

  /**
   * Persist credentials to backend/.env
   */
  persistToEnv({ apiKey, readAccessToken, authMethod }) {
    try {
      const envPath = path.resolve(__dirname, '../.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      if (apiKey !== undefined) {
        process.env.TMDB_API_KEY = apiKey.trim();
        if (envContent.includes('TMDB_API_KEY=')) {
          envContent = envContent.replace(/^TMDB_API_KEY=.*$/m, `TMDB_API_KEY=${apiKey.trim()}`);
        } else {
          envContent += `\nTMDB_API_KEY=${apiKey.trim()}`;
        }
      }

      if (readAccessToken !== undefined) {
        process.env.TMDB_ACCESS_TOKEN = readAccessToken.trim();
        if (envContent.includes('TMDB_ACCESS_TOKEN=')) {
          envContent = envContent.replace(/^TMDB_ACCESS_TOKEN=.*$/m, `TMDB_ACCESS_TOKEN=${readAccessToken.trim()}`);
        } else {
          envContent += `\nTMDB_ACCESS_TOKEN=${readAccessToken.trim()}`;
        }
      }

      if (authMethod !== undefined) {
        process.env.TMDB_AUTH_METHOD = authMethod;
        if (envContent.includes('TMDB_AUTH_METHOD=')) {
          envContent = envContent.replace(/^TMDB_AUTH_METHOD=.*$/m, `TMDB_AUTH_METHOD=${authMethod}`);
        } else {
          envContent += `\nTMDB_AUTH_METHOD=${authMethod}`;
        }
      }

      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (e) {
      console.warn('[TmdbService Warning] Could not persist credentials to .env file:', e.message);
    }
  }

  formatMovie(item) {
    if (!item) return null;
    return {
      tmdbId: item.id,
      title: item.title || item.name || '',
      originalTitle: item.original_title || item.original_name || '',
      overview: item.overview || '',
      posterPath: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : null,
      backdropPath: item.backdrop_path ? `${TMDB_IMAGE_BASE}/original${item.backdrop_path}` : null,
      releaseDate: item.release_date || item.first_air_date || '',
      releaseYear: (item.release_date || item.first_air_date) ? parseInt((item.release_date || item.first_air_date).split('-')[0], 10) : null,
      voteAverage: item.vote_average ? Math.round(item.vote_average * 10) / 10 : 0,
      voteCount: item.vote_count || 0,
      popularity: item.popularity || 0,
      originalLanguage: item.original_language || 'en',
      genreIds: item.genre_ids || [],
      genres: item.genres || [],
    };
  }

  async getTrending(timeWindow = 'day', page = 1) {
    const data = await this.fetchTmdb(`/trending/movie/${timeWindow}`, { page });
    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: (data.results || []).map((m) => this.formatMovie(m)),
    };
  }

  async getPopular(page = 1) {
    const data = await this.fetchTmdb('/movie/popular', { page });
    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: (data.results || []).map((m) => this.formatMovie(m)),
    };
  }

  async getTopRated(page = 1) {
    const data = await this.fetchTmdb('/movie/top_rated', { page });
    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: (data.results || []).map((m) => this.formatMovie(m)),
    };
  }

  async getUpcoming(page = 1) {
    const data = await this.fetchTmdb('/movie/upcoming', { page });
    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: (data.results || []).map((m) => this.formatMovie(m)),
    };
  }

  async getNowPlaying(page = 1) {
    const data = await this.fetchTmdb('/movie/now_playing', { page });
    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: (data.results || []).map((m) => this.formatMovie(m)),
    };
  }

  async getTvPopular(page = 1) {
    const data = await this.fetchTmdb('/tv/popular', { page });
    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: (data.results || []).map((m) => this.formatMovie(m)),
    };
  }

  async getGenres() {
    const data = await this.fetchTmdb('/genre/movie/list');
    return data.genres || [];
  }

  async searchMovies({ query, year, genreId, language, sortBy, minRating, page = 1 }) {
    let endpoint = '/search/movie';
    const params = { page, query };

    if (!query || query.trim().length === 0) {
      endpoint = '/discover/movie';
      delete params.query;
      if (year) params.primary_release_year = year;
      if (genreId) params.with_genres = genreId;
      if (language) params.with_original_language = language;
      if (minRating) params['vote_average.gte'] = minRating;
      if (sortBy) params.sort_by = sortBy;
    } else {
      if (year) params.primary_release_year = year;
    }

    const data = await this.fetchTmdb(endpoint, params);
    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: (data.results || []).map((m) => this.formatMovie(m)),
    };
  }

  async getMovieDetails(tmdbId) {
    const id = Number(tmdbId);

    const cached = await MovieCache.findOne({ tmdbId: id });
    if (cached && (Date.now() - new Date(cached.lastFetchedAt).getTime()) < 7 * 24 * 3600 * 1000) {
      return cached;
    }

    const [details, credits, videosData, keywordsData, providersData] = await Promise.all([
      this.fetchTmdb(`/movie/${id}`),
      this.fetchTmdb(`/movie/${id}/credits`).catch(() => ({ cast: [], crew: [] })),
      this.fetchTmdb(`/movie/${id}/videos`).catch(() => ({ results: [] })),
      this.fetchTmdb(`/movie/${id}/keywords`).catch(() => ({ keywords: [] })),
      this.fetchTmdb(`/movie/${id}/watch/providers`).catch(() => ({ results: {} })),
    ]);

    const videos = videosData.results || [];
    const keywords = keywordsData.keywords || [];
    const watchProvidersData = providersData.results || {};

    const trailer = videos.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || videos[0];

    const directors = (credits.crew || [])
      .filter((member) => member.job === 'Director')
      .map((d) => ({ id: d.id, name: d.name }));

    const cast = (credits.cast || []).slice(0, 15).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : null,
    }));

    const regionProviders = watchProvidersData.US || watchProvidersData.IN || Object.values(watchProvidersData)[0];
    const flatrate = regionProviders?.flatrate || [];
    const streamingProviders = flatrate.map((p) => ({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoPath: p.logo_path ? `${TMDB_IMAGE_BASE}/w92${p.logo_path}` : null,
    }));

    const featureTokens = [
      (details.genres || []).map((g) => g.name).join(' '),
      directors.map((d) => d.name).join(' '),
      cast.slice(0, 5).map((c) => c.name).join(' '),
      keywords.map((k) => k.name).join(' '),
      details.overview || '',
    ].join(' ');

    const movieDoc = {
      tmdbId: details.id,
      title: details.title || '',
      originalTitle: details.original_title || '',
      overview: details.overview || '',
      posterPath: details.poster_path ? `${TMDB_IMAGE_BASE}/w500${details.poster_path}` : null,
      backdropPath: details.backdrop_path ? `${TMDB_IMAGE_BASE}/original${details.backdrop_path}` : null,
      releaseDate: details.release_date || '',
      releaseYear: details.release_date ? parseInt(details.release_date.split('-')[0], 10) : null,
      runtime: details.runtime || 0,
      voteAverage: details.vote_average ? Math.round(details.vote_average * 10) / 10 : 0,
      voteCount: details.vote_count || 0,
      popularity: details.popularity || 0,
      originalLanguage: details.original_language || 'en',
      genres: details.genres || [],
      cast,
      directors,
      keywords,
      productionCompanies: (details.production_companies || []).map((p) => ({ id: p.id, name: p.name })),
      trailerKey: trailer ? trailer.key : null,
      streamingProviders,
      featureString: featureTokens,
      lastFetchedAt: new Date(),
    };

    const updated = await MovieCache.findOneAndUpdate(
      { tmdbId: id },
      { $set: movieDoc },
      { upsert: true, new: true }
    );

    return updated;
  }

  async getPersonDetails(personId) {
    const [p, credits] = await Promise.all([
      this.fetchTmdb(`/person/${personId}`),
      this.fetchTmdb(`/person/${personId}/movie_credits`).catch(() => ({ cast: [], crew: [] })),
    ]);

    return {
      id: p.id,
      name: p.name,
      biography: p.biography,
      birthday: p.birthday,
      placeOfBirth: p.place_of_birth,
      profilePath: p.profile_path ? `${TMDB_IMAGE_BASE}/h632${p.profile_path}` : null,
      knownForDepartment: p.known_for_department,
      castMovies: (credits.cast || []).slice(0, 20).map((m) => this.formatMovie(m)),
      directedMovies: (credits.crew || []).filter((c) => c.job === 'Director').slice(0, 20).map((m) => this.formatMovie(m)),
    };
  }
}

export const tmdbService = new TmdbService();
export default tmdbService;
