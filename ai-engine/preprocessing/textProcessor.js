/**
 * Text Preprocessing and Feature Extraction for Content-Based Movie Recommendation
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
  'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Tokenize and normalize text into clean lowercased words without punctuation or stopwords
 * @param {string} text 
 * @returns {string[]}
 */
export const tokenize = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
};

/**
 * Build a weighted "soup" / bag of words from movie metadata:
 * - Genres (repeated 3x for weight)
 * - Director (repeated 3x for weight)
 * - Top 4 Cast members (repeated 2x for weight)
 * - Keywords (repeated 2x for weight)
 * - Overview synopsis (1x weight)
 * @param {Object} movie 
 * @returns {string}
 */
export const createMovieFeatureSoup = (movie) => {
  if (!movie) return '';

  const genreNames = (movie.genres || []).map(g => (typeof g === 'string' ? g : g.name || '')).filter(Boolean);
  const directorNames = (movie.directors || []).map(d => (typeof d === 'string' ? d : d.name || '')).filter(Boolean);
  const castNames = (movie.cast || []).slice(0, 5).map(c => (typeof c === 'string' ? c : c.name || '')).filter(Boolean);
  const keywordNames = (movie.keywords || []).map(k => (typeof k === 'string' ? k : k.name || '')).filter(Boolean);
  const overview = movie.overview || '';

  // Sanitize names into single tokens (e.g., "Christopher Nolan" -> "christopher_nolan") to avoid partial cross-matching
  const cleanToken = (name) => name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');

  const genresWeighted = genreNames.map(cleanToken).join(' ').repeat(3);
  const directorsWeighted = directorNames.map(cleanToken).join(' ').repeat(3);
  const castWeighted = castNames.map(cleanToken).join(' ').repeat(2);
  const keywordsWeighted = keywordNames.map(cleanToken).join(' ').repeat(2);

  return `${genresWeighted} ${directorsWeighted} ${castWeighted} ${keywordsWeighted} ${overview}`.trim();
};
