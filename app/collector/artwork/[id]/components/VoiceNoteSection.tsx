// app/collector/artwork/[id]/components/VoiceNoteSection.tsx
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

interface VoiceNoteSectionProps {
  title: string;
  contentUrl: string;
  transcript?: string;
  artistPhoto?: string;
}

const VoiceNoteSection: React.FC<VoiceNoteSectionProps> = ({
  title,
  contentUrl,
  transcript,
  artistPhoto,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      };

      const setAudioTime = () => setCurrentTime(audio.currentTime);

      const setAudioProgress = () => {
        if (audio.duration > 0) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.addEventListener('loadedmetadata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('timeupdate', setAudioProgress);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('loadedmetadata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('timeupdate', setAudioProgress);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = (audio.duration / 100) * parseInt(e.target.value);
      audio.currentTime = newTime;
      setProgress(parseInt(e.target.value));
    }
  };

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold mb-8">Voice Note</h2>
      <div className="bg-gray-900 rounded-lg p-6 shadow-lg flex items-center space-x-4">
        {artistPhoto && (
          <Image
            src={artistPhoto}
            alt="Artist Profile"
            width={64}
            height={64}
            className="rounded-full object-cover"
          />
        )}
        <div className="flex-grow">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <audio ref={audioRef} src={contentUrl} preload="metadata" />
          <div className="flex items-center space-x-4">
            <button onClick={togglePlayPause} className="text-green-400 text-2xl">
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="flex-grow accent-green-400"
            />
            <span className="text-sm text-gray-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          {/* Placeholder for waveform visualization */}
          <div className="w-full h-8 bg-gray-700 rounded-md mt-2 flex items-center justify-center text-gray-500 text-xs">
            [Waveform Visualization Placeholder]
          </div>
        </div>
      </div>
      {transcript && (
        <div className="mt-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
          </button>
          {showTranscript && (
            <div className="bg-gray-800 p-4 rounded-lg mt-2 text-gray-300">
              <p>{transcript}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default VoiceNoteSection;
