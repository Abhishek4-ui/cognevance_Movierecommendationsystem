import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cineai_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Refresh Token rotation on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newAccessToken = refreshRes.data?.tokens?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('cineai_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('cineai_access_token');
        localStorage.removeItem('cineai_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  deleteAccount: () => api.delete('/auth/delete-account'),
};

export const moviesApi = {
  getStatus: () => api.get('/movies/status'),
  updateApiKey: (credentials) => api.post('/movies/config-key', typeof credentials === 'string' ? { apiKey: credentials } : credentials),
  getTrending: (window = 'day', page = 1) => api.get(`/movies/trending?window=${window}&page=${page}`),
  getPopular: (page = 1) => api.get(`/movies/popular?page=${page}`),
  getTopRated: (page = 1) => api.get(`/movies/top-rated?page=${page}`),
  getUpcoming: (page = 1) => api.get(`/movies/upcoming?page=${page}`),
  getNowPlaying: (page = 1) => api.get(`/movies/now-playing?page=${page}`),
  getTvPopular: (page = 1) => api.get(`/movies/tv-popular?page=${page}`),
  getGenres: () => api.get('/movies/genres'),
  search: (params) => api.get('/movies/search', { params }),
  getDetails: (id) => api.get(`/movies/${id}`),
  getPerson: (id) => api.get(`/movies/person/${id}`),
};

export const recsApi = {
  getPersonalized: (limit = 12) => api.get(`/recommendations/personalized?limit=${limit}`),
  getSimilar: (id, limit = 10) => api.get(`/recommendations/similar/${id}?limit=${limit}`),
  getMood: (mood, params = {}) => api.get('/recommendations/mood', { params: { mood, ...params } }),
  getModelStatus: () => api.get('/recommendations/model-status'),
  trainModel: () => api.post('/recommendations/train'),
};

export const watchlistApi = {
  getAll: () => api.get('/watchlists'),
  create: (data) => api.post('/watchlists', data),
  delete: (id) => api.delete(`/watchlists/${id}`),
  addMovie: (watchlistId, data) => api.post(`/watchlists/${watchlistId}/movies`, data),
  removeMovie: (watchlistId, tmdbId) => api.delete(`/watchlists/${watchlistId}/movies/${tmdbId}`),
  updateStatus: (watchlistId, tmdbId, status) => api.put(`/watchlists/${watchlistId}/movies/${tmdbId}/status`, { status }),
};

export const favoritesApi = {
  getAll: () => api.get('/favorites'),
  toggle: (data) => api.post('/favorites/toggle', data),
  check: (tmdbId) => api.get(`/favorites/check/${tmdbId}`),
};

export const ratingsReviewsApi = {
  rate: (data) => api.post('/ratings/ratings', data),
  getUserRating: (tmdbId) => api.get(`/ratings/ratings/${tmdbId}`),
  getReviews: (tmdbId) => api.get(`/ratings/reviews/${tmdbId}`),
  createReview: (data) => api.post('/ratings/reviews', data),
  likeReview: (id) => api.post(`/ratings/reviews/${id}/like`),
  getComments: (reviewId) => api.get(`/ratings/reviews/${reviewId}/comments`),
  addComment: (reviewId, content) => api.post(`/ratings/reviews/${reviewId}/comments`, { content }),
};

export const dashboardApi = {
  getAnalytics: () => api.get('/dashboard/analytics'),
};

export const aiChatApi = {
  sendMessage: (message, conversationId) => api.post('/ai/chat', { message, conversationId }),
  getHistory: () => api.get('/ai/history'),
  deleteConversation: (id) => api.delete(`/ai/history/${id}`),
};

export const socialApi = {
  getFeed: () => api.get('/social/feed'),
  getProfile: (id) => api.get(`/social/profile/${id}`),
  toggleFollow: (id) => api.post(`/social/follow/${id}`),
};

export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id = 'all') => api.put(`/notifications/${id}/read`),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getReports: () => api.get('/admin/reports'),
  resolveReport: (id, data) => api.put(`/admin/reports/${id}`, data),
};

export default api;
