// app/collector/artwork/[id]/components/ArtistNoteSection.tsx
import React from 'react';
import Image from 'next/image';

interface ArtistNoteSectionProps {
  content: string;
  signatureUrl?: string;
}

const ArtistNoteSection: React.FC<ArtistNoteSectionProps> = ({
  content,
  signatureUrl,
}) => {
  return (
    <section className="py-16 font-serif text-white max-w-2xl mx-auto">
      <div className="bg-gray-900 rounded-lg p-10 shadow-lg">
        <p className="text-xl leading-relaxed whitespace-pre-wrap mb-8">
          {content}
        </p>
        {signatureUrl && (
          <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
            <Image
              src={signatureUrl}
              alt="Artist Signature"
              width={150}
              height={60}
              objectFit="contain"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default ArtistNoteSection;
