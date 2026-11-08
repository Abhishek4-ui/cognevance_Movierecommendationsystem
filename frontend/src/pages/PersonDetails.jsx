import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, MapPin, Film, Video, Loader2 } from 'lucide-react';
import { moviesApi } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function PersonDetails() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moviesApi.getPerson(id)
      .then((res) => setPerson(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-electric-400" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <User className="w-10 h-10 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Person Not Found</h2>
        <Link to="/explore" className="inline-block px-4 py-2 glow-button text-xs font-bold text-white rounded-xl">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Profile Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            {person.profilePath ? (
              <img src={person.profilePath} alt={person.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">No Photo</div>
            )}
          </div>
        </div>

        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-electric-400 border border-slate-700">
            {person.knownForDepartment || 'Cinema Artist'}
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-display">{person.name}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {person.birthday && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Born: {person.birthday}
              </span>
            )}
            {person.placeOfBirth && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {person.placeOfBirth}
              </span>
            )}
          </div>

          {person.biography && (
            <div className="pt-2">
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Biography</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-2">
                {person.biography}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Directed Movies */}
      {person.directedMovies && person.directedMovies.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Video className="w-5 h-5 text-electric-400" />
            <span>Directed by {person.name}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {person.directedMovies.map(movie => (
              <MovieCard key={movie.tmdbId || movie.id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Acting Roles */}
      {person.castMovies && person.castMovies.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <span>Starring {person.name}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {person.castMovies.map(movie => (
              <MovieCard key={movie.tmdbId || movie.id} movie={movie} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
