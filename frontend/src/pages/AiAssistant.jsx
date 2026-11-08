import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User as UserIcon,
  Loader2,
  Film,
  Star,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiChatApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hi there! I'm your CineAI movie concierge. Ask me for recommendations based on your mood, favorite directors, stories, or actors — I'm here to help you find your next great watch.",
      movieSuggestions: [],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryToSend) => {
    const text = queryToSend || inputQuery;
    if (!text || !text.trim()) return;

    const userMsg = { sender: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await aiChatApi.sendMessage(text.trim(), conversationId);
      if (res.data?.conversationId) {
        setConversationId(res.data.conversationId);
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.data?.response?.text || 'Here are relevant cinematic picks matching your criteria:',
          movieSuggestions: res.data?.response?.movieSuggestions || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, I had trouble finding recommendations right now. Please try asking again in a moment!',
          movieSuggestions: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    'Recommend movies similar to Interstellar',
    'Suggest mind-bending Christopher Nolan thrillers',
    'Recommend family-friendly animated movies',
    'I feel relaxed, suggest a cozy comfort movie',
    'Suggest the best crime movies released after 2015',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-400 to-accent-purple flex items-center justify-center text-white shadow-lg shadow-electric-500/20">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>CineAI Movie Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Online
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Your personal movie advisor — ask for recommendations, themes, or hidden gems
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                sender: 'assistant',
                text: 'Chat history cleared. How can I assist your movie discovery today?',
                movieSuggestions: [],
              },
            ]);
            setConversationId(null);
          }}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
          title="Reset Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-grow overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-electric-500/20 border border-electric-500/30 flex items-center justify-center text-electric-400 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm space-y-3 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-electric-600 text-white rounded-tr-none'
                  : 'bg-navy-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl'
              }`}
            >
              <p>{msg.text}</p>

              {/* Render movie suggestion cards if assistant returned matches */}
              {msg.movieSuggestions && msg.movieSuggestions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {msg.movieSuggestions.map((m) => (
                    <Link
                      key={m.tmdbId}
                      to={`/movie/${m.tmdbId}`}
                      className="group flex gap-2.5 p-2 rounded-xl bg-black/40 hover:bg-slate-800/80 border border-slate-700/60 transition"
                    >
                      <div className="w-12 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                        {m.posterPath ? (
                          <img src={m.posterPath} alt={m.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center min-w-0 flex-grow">
                        <span className="text-xs font-bold text-white group-hover:text-electric-400 transition truncate">
                          {m.title}
                        </span>
                        {m.voteAverage > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{m.voteAverage.toFixed(1)}/10</span>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {m.matchReason || m.overview}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-electric-500/20 flex items-center justify-center text-electric-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-navy-900 border border-slate-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-electric-400" />
              <span>Finding the perfect movies for you...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Popular Query Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 shrink-0 transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask for movie recommendations by genre, mood, director, plot..."
          disabled={loading}
          className="w-full pl-4 pr-14 py-3.5 rounded-2xl bg-navy-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-400 transition"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="absolute right-2.5 p-2 glow-button text-white rounded-xl transition disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
