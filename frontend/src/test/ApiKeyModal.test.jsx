import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApiKeyModal from '../components/ApiKeyModal';
import { moviesApi } from '../services/api';

vi.mock('../services/api', () => ({
  moviesApi: {
    getStatus: vi.fn(() => Promise.resolve({
      data: {
        success: true,
        hasApiKey: true,
        hasCredentials: true,
        authMethod: 'v4',
        cachedMoviesCount: 42,
      },
    })),
    updateApiKey: vi.fn(() => Promise.resolve({
      data: {
        success: true,
        message: 'Credentials verified & saved successfully!',
        authMethod: 'v4',
        details: { testMovie: 'Interstellar' },
      },
    })),
  },
}));

describe('ApiKeyModal Component', () => {
  it('renders both v4 Read Access Token and v3 API Key credential fields', async () => {
    render(<ApiKeyModal isOpen={true} onClose={() => {}} onKeyUpdated={() => {}} />);

    // Header and description
    await waitFor(() => {
      expect(screen.getByText(/TMDB Authentication Setup/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/v4 Access Token/i)).toBeInTheDocument();
    expect(screen.getByText(/v3 API Key/i)).toBeInTheDocument();

    // Field labels
    expect(screen.getByText(/1\. TMDB API Read Access Token \(v4\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. TMDB API Key \(v3 auth\)/i)).toBeInTheDocument();

    // Verify submit button is present
    expect(screen.getByRole('button', { name: /Validate & Save Credentials/i })).toBeInTheDocument();
  });

  it('allows switching between v4 and v3 authentication methods', async () => {
    render(<ApiKeyModal isOpen={true} onClose={() => {}} onKeyUpdated={() => {}} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /v3 API Key/i })).toBeInTheDocument();
    });

    const v3Button = screen.getByRole('button', { name: /v3 API Key/i });
    fireEvent.click(v3Button);

    const v4Button = screen.getByRole('button', { name: /v4 Access Token/i });
    fireEvent.click(v4Button);
  });

  it('submits credentials and triggers onKeyUpdated upon successful verification', async () => {
    const handleKeyUpdated = vi.fn();
    render(<ApiKeyModal isOpen={true} onClose={() => {}} onKeyUpdated={handleKeyUpdated} />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiJ9/i);
    fireEvent.change(tokenInput, { target: { value: 'eyJhbGciOiJIUzI1NiJ9.sample_valid_token' } });

    const submitBtn = screen.getByRole('button', { name: /Validate & Save Credentials/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(moviesApi.updateApiKey).toHaveBeenCalledWith({
        readAccessToken: 'eyJhbGciOiJIUzI1NiJ9.sample_valid_token',
        apiKey: '',
        authMethod: 'v4',
      });
      expect(handleKeyUpdated).toHaveBeenCalled();
    });
  });
});
