// app/vendor/dashboard/artwork-pages/components/BuilderProgress.tsx
import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface BuilderProgressProps {
  publishedCount: number;
  totalCount: number;
  recommendations?: string[];
}

const BuilderProgress: React.FC<BuilderProgressProps> = ({
  publishedCount,
  totalCount,
  recommendations,
}) => {
  const progressPercentage = totalCount > 0 ? (publishedCount / totalCount) * 100 : 0;
  const isComplete = progressPercentage === 100 && totalCount > 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Collector Experience</h2>
        {isComplete ? (
          <Badge className="bg-green-500 text-white px-3 py-1 rounded-full text-base">
            <CheckCircle className="h-4 w-4 mr-2" />
            100% Complete
          </Badge>
        ) : (
          <Badge className="bg-blue-600 text-white px-3 py-1 rounded-full text-base">
            {Math.round(progressPercentage)}% Complete
          </Badge>
        )}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      {recommendations && recommendations.length > 0 && (
        <div className="text-gray-400 text-sm italic">
          <p className="mb-2">💡 Tips for a richer experience:</p>
          <ul className="list-disc list-inside space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
      {!isComplete && recommendations?.length === 0 && (
        <p className="text-gray-400 text-sm">
          Add more content sections to complete your collector experience.
        </p>
      )}
    </div>
  );
};

export default BuilderProgress;
