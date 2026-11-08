# CineAI REST API & System Architecture Documentation

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account & dispatch email OTP | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit email OTP and activate account | No |
| `POST` | `/api/auth/resend-otp` | Request a fresh OTP code | No |
| `POST` | `/api/auth/login` | Authenticate user credentials & issue JWT tokens | No |
| `POST` | `/api/auth/refresh` | Rotate JWT access and refresh tokens | No (Cookie) |
| `POST` | `/api/auth/logout` | Revoke session and clear refresh cookie | Yes |
| `POST` | `/api/auth/forgot-password` | Generate reset token for forgotten password | No |
| `POST` | `/api/auth/reset-password` | Reset password using valid cryptographic token | No |
| `GET` | `/api/auth/profile` | Retrieve authenticated user profile | Yes |
| `PUT` | `/api/auth/profile` | Update profile information (name, bio, avatar) | Yes |
| `PUT` | `/api/auth/change-password` | Securely update password | Yes |

---

## 2. Movies Catalog Endpoints (`/api/movies`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/movies/status` | Returns TMDB connection health & cache metrics |
| `POST` | `/api/movies/config-key` | Set/Update TMDB API key dynamically (Admin) |
| `GET` | `/api/movies/trending` | Fetch trending movies (window=day\|week, page) |
| `GET` | `/api/movies/popular` | Fetch popular movies |
| `GET` | `/api/movies/top-rated` | Fetch all-time critically acclaimed movies |
| `GET` | `/api/movies/upcoming` | Fetch upcoming theater releases |
| `GET` | `/api/movies/now-playing` | Fetch now playing movies |
| `GET` | `/api/movies/genres` | Fetch movie genres list |
| `GET` | `/api/movies/search` | Multi-filter search (query, genre, year, rating, sort) |
| `GET` | `/api/movies/:id` | Fetch movie details, cast, director, trailer, providers |
| `GET` | `/api/movies/person/:id` | Fetch actor/director biography & credits |

---

## 3. Machine Learning Recommendation Endpoints (`/api/recommendations`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recommendations/personalized` | Hybrid recommendations personalized to user |
| `GET` | `/api/recommendations/similar/:id` | Content-Based similar movies via TF-IDF cosine |
| `GET` | `/api/recommendations/mood` | Mood-based recommendations (10 moods) |
| `GET` | `/api/recommendations/model-status` | Report TensorFlow.js loss, vocab size, metrics |
| `POST` | `/api/recommendations/train` | Trigger immediate pipeline re-training |

---

## 4. User Interactions & Collections

- `/api/watchlists`: Manage custom and default watchlists
- `/api/favorites`: Toggle and list favorites
- `/api/ratings/ratings`: Record 1-10 movie ratings
- `/api/ratings/reviews`: Community reviews and comments
- `/api/dashboard/analytics`: Analytics data formatted for Recharts
- `/api/ai/chat`: Interactive AI Movie Chatbot
- `/api/social`: Public activity feed & member profiles
