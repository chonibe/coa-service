// app/collector/artwork/[id]/components/ProcessGallerySection.tsx
import React, { useState } from 'react';
import Image from 'next/image';

interface ProcessGallerySectionProps {
  intro?: string;
  images: Array<{ url: string; caption?: string; order: number }>;
}

const ProcessGallerySection: React.FC<ProcessGallerySectionProps> = ({
  intro,
  images,
}) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  if (!images || images.length === 0) {
    return null; // Or render an empty state
  }

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold mb-8">Process Gallery</h2>
      {intro && <p className="text-lg text-gray-300 mb-8">{intro}</p>}

      <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden mb-6 shadow-lg">
        <Image
          src={selectedImage.url}
          alt={selectedImage.caption || 'Process Image'}
          layout="fill"
          objectFit="contain"
          className="transition-opacity duration-300"
        />
        {selectedImage.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white text-sm">
            {selectedImage.caption}
          </div>
        )}
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {images
          .sort((a, b) => a.order - b.order)
          .map((image) => (
            <div
              key={image.url}
              className={`flex-shrink-0 w-24 h-24 relative rounded-md overflow-hidden cursor-pointer transition-all duration-200
                ${selectedImage.url === image.url
                  ? 'ring-2 ring-green-400 scale-105'
                  : 'ring-1 ring-gray-700 hover:ring-green-400'
                }`}
              onClick={() => setSelectedImage(image)}
            >
              <Image
                src={image.url}
                alt={image.caption || 'Thumbnail'}
                layout="fill"
                objectFit="cover"
              />
            </div>
          ))}
      </div>
    </section>
  );
};

export default ProcessGallerySection;
