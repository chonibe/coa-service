// app/vendor/dashboard/artwork-pages/components/SoundtrackEditor.tsx
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui';

interface SoundtrackEditorProps {
  spotifyUrl: string;
  note?: string;
  onUpdate: (updates: { spotify_url?: string; note?: string }) => void;
}

const SoundtrackEditor: React.FC<SoundtrackEditorProps> = ({
  spotifyUrl: initialSpotifyUrl,
  note: initialNote,
  onUpdate,
}) => {
  const [spotifyUrl, setSpotifyUrl] = useState(initialSpotifyUrl);
  const [note, setNote] = useState(initialNote);
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [trackId, setTrackId] = useState<string | null>(null);

  // Function to extract track ID from Spotify URL
  const getTrackId = (url: string) => {
    const match = url.match(/track\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const id = getTrackId(spotifyUrl);
    setTrackId(id);
    setIsValidUrl(!!id || spotifyUrl === '');
  }, [spotifyUrl]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setSpotifyUrl(newUrl);
    onUpdate({ spotify_url: newUrl });
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNote(newNote);
    onUpdate({ note: newNote });
  };

  const embedUrl = trackId
    ? `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`
    : '';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Spotify Track URL</label>
        <Input
          type="url"
          placeholder="https://open.spotify.com/track/..."
          value={spotifyUrl}
          onChange={handleUrlChange}
          className={`w-full bg-gray-700 border ${isValidUrl ? 'border-gray-600' : 'border-red-500'} text-white`}
        />
        {!isValidUrl && spotifyUrl !== '' && (
          <p className="text-red-400 text-xs mt-1">Please enter a valid Spotify track URL.</p>
        )}
      </div>

      {trackId && isValidUrl && (
        <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-t-lg"
          ></iframe>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Why this track? (optional but recommended)</label>
        <textarea
          placeholder="This song was on repeat while I worked on the final details. The rhythm mirrors the visual flow I was going for..."
          value={note || ''}
          onChange={handleNoteChange}
          maxLength={500}
          rows={4}
          className="w-full p-3 bg-gray-700 rounded-md text-gray-200 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">{note?.length || 0}/500 characters</p>
        <p className="text-xs text-gray-500 mt-1">💡 Tip: Collectors love knowing the creative context.</p>
      </div>
    </div>
  );
};

export default SoundtrackEditor;
