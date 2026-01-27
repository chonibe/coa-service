// app/collector/artwork/[id]/components/SoundtrackSection.tsx
import React from 'react';

interface SoundtrackSectionProps {
  spotifyUrl: string;
  note?: string;
}

const SoundtrackSection: React.FC<SoundtrackSectionProps> = ({ spotifyUrl, note }) => {
  // Extract track ID from Spotify URL
  const getTrackId = (url: string) => {
    const match = url.match(/track\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
  };

  const trackId = getTrackId(spotifyUrl);

  if (!trackId) {
    return null; // Or render an error/placeholder
  }

  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold mb-8">Soundtrack</h2>
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <iframe
          src={embedUrl}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-t-lg"
        ></iframe>
        {note && (
          <div className="p-6 text-gray-300">
            <p className="italic mb-4">"{note}"</p>
            <p className="text-sm">— Artist's Note</p>
          </div>
        )}
      </div>
      <a
        href={spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-green-400 hover:text-green-300 transition-colors"
      >
        Open in Spotify
      </a>
    </section>
  );
};

export default SoundtrackSection;
