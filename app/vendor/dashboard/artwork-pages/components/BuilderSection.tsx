// app/vendor/dashboard/artwork-pages/components/BuilderSection.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

interface BuilderSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onDelete: () => void;
  isEmpty: boolean;
  isPartial: boolean;
  isCompleted: boolean;
  prompt: string;
}

const BuilderSection: React.FC<BuilderSectionProps> = ({
  title,
  icon,
  children,
  onDelete,
  isEmpty,
  isPartial,
  isCompleted,
  prompt,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const borderClass = isEmpty
    ? 'border-dashed border-gray-600'
    : isPartial
    ? 'border-solid border-yellow-600'
    : 'border-solid border-green-600';

  const headerBgClass = isEmpty ? 'bg-gray-800' : 'bg-gray-700';

  return (
    <div className={`rounded-lg p-6 shadow-xl space-y-4 border ${borderClass} ${headerBgClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-lg font-semibold text-white">{title}</span>
          {isCompleted && (
            <Badge className="bg-green-500 text-white px-3 py-1 rounded-full">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
          {isPartial && (
            <Badge className="bg-yellow-500 text-white px-3 py-1 rounded-full">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Partial
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEmpty ? (
            <Button onClick={() => setIsExpanded(true)} className="bg-blue-600 hover:bg-blue-700">
              Add
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {!isExpanded && isEmpty && (
        <p className="text-gray-400 italic text-center">{prompt}</p>
      )}

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          {children}
        </div>
      )}
    </div>
  );
};

export default BuilderSection;
