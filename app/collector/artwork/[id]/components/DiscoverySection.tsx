// app/collector/artwork/[id]/components/DiscoverySection.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCountdown } from '@/lib/countdown';

interface DiscoveryArtwork {
  id: string;
  name: string;
  imgUrl: string;
  isOwned?: boolean;
  isLocked?: boolean;
}

interface DiscoverySectionProps {
  artworkId: string;
  artistName: string;
  seriesId?: string;
  unlockedContent?: {
    type: 'hidden_series' | 'vip_artwork' | 'vip_series';
    id: string;
    name: string;
    thumbnailUrl?: string;
  };
  seriesInfo?: {
    name: string;
    totalCount: number;
    ownedCount: number;
    artworks: DiscoveryArtwork[];
    nextArtwork?: { id: string; name: string; imgUrl: string };
    unlockType: 'sequential' | 'time_based' | 'threshold' | 'any_purchase';
  };
  countdown?: {
    unlockAt: string; // ISO timestamp
    artworkName: string;
    artworkImgUrl?: string;
  };
  moreFromArtist?: Array<{
    id: string;
    name: string;
    imgUrl: string;
    price?: string;
  }>;
}

const DiscoverySection: React.FC<DiscoverySectionProps> = ({
  artistName,
  unlockedContent,
  seriesInfo,
  countdown,
  moreFromArtist,
}) => {
  if (!unlockedContent && !seriesInfo && !countdown && !moreFromArtist) {
    return null; // Hide section if no discovery data
  }

  const renderContent = () => {
    if (unlockedContent) {
      return (
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center">
          {unlockedContent.thumbnailUrl && (
            <Image
              src={unlockedContent.thumbnailUrl}
              alt={unlockedContent.name}
              width={128}
              height={128}
              className="rounded-md mb-4 blur-md"
            />
          )}
          <h3 className="text-xl font-semibold text-green-400 mb-2">UNLOCKED BY THIS PIECE</h3>
          <p className="text-lg text-white mb-2">{unlockedContent.name}</p>
          <p className="text-gray-400 mb-4">
            You've unlocked access to this exclusive {unlockedContent.type.replace('_', ' ')}
          </p>
          <Link href={`/collector/${unlockedContent.type.split('_')[0]}/${unlockedContent.id}`}>
            <a className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Explore Series
            </a>
          </Link>
        </div>
      );
    } else if (seriesInfo) {
      return (
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center">
          <h3 className="text-xl font-semibold text-white mb-2">NEXT IN SERIES</h3>
          <p className="text-lg text-green-400 mb-4">
            {seriesInfo.name} - {seriesInfo.ownedCount} of {seriesInfo.totalCount}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {seriesInfo.artworks.map((artwork) => (
              <span
                key={artwork.id}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm
                  ${artwork.isOwned
                      ? 'bg-green-600 text-white'
                      : artwork.isLocked
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-blue-600 text-white'
                    }`}
              >
                {artwork.isOwned ? '✓' : artwork.isLocked ? '🔒' : ''}
              </span>
            ))}
          </div>
          {seriesInfo.nextArtwork && (
            <p className="text-gray-400 mb-4">Next unlock: "{seriesInfo.nextArtwork.name}"</p>
          )}
          <Link href={`/collector/series/${seriesInfo.name}`}>
            <a className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              View Series
            </a>
          </Link>
        </div>
      );
    } else if (countdown) {
      const remainingTime = formatCountdown(countdown.unlockAt);
      return (
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center">
          <h3 className="text-xl font-semibold text-white mb-2">COMING SOON</h3>
          {countdown.artworkImgUrl && (
            <Image
              src={countdown.artworkImgUrl}
              alt={countdown.artworkName}
              width={128}
              height={128}
              className="rounded-md mb-4 blur-md"
            />
          )}
          <p className="text-lg text-green-400 mb-2">{countdown.artworkName}</p>
          <p className="text-2xl font-bold text-white mb-4">{remainingTime}</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Set Reminder
          </button>
        </div>
      );
    } else if (moreFromArtist) {
      return (
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center">
          <h3 className="text-xl font-semibold text-white mb-4">MORE FROM {artistName.toUpperCase()}</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {moreFromArtist.map((artwork) => (
              <Link href={`/collector/artwork/${artwork.id}`} key={artwork.id}>
                <a className="flex-shrink-0 w-32 text-center">
                  <Image
                    src={artwork.imgUrl}
                    alt={artwork.name}
                    width={128}
                    height={128}
                    className="rounded-md mb-2 object-cover"
                  />
                  <p className="text-sm text-gray-200 truncate">{artwork.name}</p>
                  {artwork.price && <p className="text-xs text-gray-400">{artwork.price}</p>}
                </a>
              </Link>
            ))}
            {moreFromArtist.length > 0 && (
              <Link href={`/collector/artist/${artistName.toLowerCase().replace(/ /g, '-')}`}>
                <a className="flex-shrink-0 w-32 flex items-center justify-center text-green-400 hover:text-green-300">
                  View All →
                </a>
              </Link>
            )}
          </div>
          <Link href={`/collector/artist/${artistName.toLowerCase().replace(/ /g, '-')}`}>
            <a className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              View All Artworks
            </a>
          </Link>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold mb-8">Discover More</h2>
      {renderContent()}
    </section>
  );
};

export default DiscoverySection;
