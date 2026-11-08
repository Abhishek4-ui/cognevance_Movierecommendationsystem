import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { AuthProvider } from '../context/AuthContext';

describe('MovieCard Component', () => {
  it('renders movie title, rating, and AI match confidence badge', () => {
    const movie = {
      tmdbId: 157336,
      title: 'Interstellar',
      posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      voteAverage: 8.4,
      releaseYear: 2014,
      genres: [{ name: 'Sci-Fi' }],
    };

    render(
      <AuthProvider>
        <BrowserRouter>
          <MovieCard
            movie={movie}
            confidence={95}
            explanation="Christopher Nolan directional affinity"
          />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Interstellar')).toBeInTheDocument();
    expect(screen.getByText('8.4')).toBeInTheDocument();
    expect(screen.getByText('95% Match')).toBeInTheDocument();
    expect(screen.getByText(/Christopher Nolan/)).toBeInTheDocument();
  });
});
