// app/collector/artwork/[id]/components/InspirationBoardSection.tsx
import React, { useState } from 'react';
import Image from 'next/image';

interface InspirationBoardSectionProps {
  story?: string;
  images: Array<{ url: string; caption?: string }>;
}

const InspirationBoardSection: React.FC<InspirationBoardSectionProps> = ({
  story,
  images,
}) => {
  const [expandedImage, setExpandedImage] = useState<{ url: string; caption?: string } | null>(null);

  if (!images || images.length === 0) {
    return null; // Or render an empty state
  }

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold mb-8">Inspiration Board</h2>
      {story && <p className="text-lg text-gray-300 mb-8">{story}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden cursor-pointer shadow-lg hover:ring-2 hover:ring-green-400 transition-all duration-200"
            onClick={() => setExpandedImage(image)}
          >
            <Image
              src={image.url}
              alt={image.caption || 'Inspiration Image'}
              layout="fill"
              objectFit="cover"
            />
          </div>
        ))}
      </div>

      {expandedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="relative bg-gray-900 rounded-lg p-6 max-w-3xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
          >
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-2 right-2 text-white text-3xl leading-none"
            >
              &times;
            </button>
            <Image
              src={expandedImage.url}
              alt={expandedImage.caption || 'Expanded Image'}
              width={800}
              height={600}
              objectFit="contain"
              className="rounded-lg"
            />
            {expandedImage.caption && (
              <p className="mt-4 text-gray-300 text-center">{expandedImage.caption}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default InspirationBoardSection;
