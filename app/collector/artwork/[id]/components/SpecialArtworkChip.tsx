// app/collector/artwork/[id]/components/SpecialArtworkChip.tsx
import React from 'react';
import { FiUnlock, FiCalendar, FiTag, FiKey, FiAward, FiCheckCircle } from 'react-icons/fi';

interface SpecialArtworkChipProps {
  type: 'unlocks_hidden' | 'series' | 'timed_release' | 'vip_access' | 'limited_edition' | 'authenticated';
  label: string;
  sublabel?: string;
  icon?: string; // Optional custom icon
}

const getIcon = (type: SpecialArtworkChipProps['type']) => {
  switch (type) {
    case 'unlocks_hidden':
      return <FiUnlock />;
    case 'series':
      return <FiTag />;
    case 'timed_release':
      return <FiCalendar />;
    case 'vip_access':
      return <FiKey />;
    case 'limited_edition':
      return <FiAward />;
    case 'authenticated':
      return <FiCheckCircle />;
    default:
      return null;
  }
};

const SpecialArtworkChip: React.FC<SpecialArtworkChipProps> = ({
  type,
  label,
  sublabel,
  icon,
}) => {
  const IconComponent = icon ? <img src={icon} alt="chip icon" className="w-4 h-4 mr-2" /> : getIcon(type);

  return (
    <div
      className="inline-flex items-center bg-gray-700 text-white text-xs px-3 py-1 rounded-full mr-2 mb-2"
    >
      {IconComponent && <span className="mr-1">{IconComponent}</span>}
      <span>{label}</span>
      {sublabel && <span className="ml-1 text-gray-300">{sublabel}</span>}
    </div>
  );
};

export default SpecialArtworkChip;
