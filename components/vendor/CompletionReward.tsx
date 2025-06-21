'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, CheckCircle } from 'lucide-react';

type CompletionRewardProps = {
  isVisible: boolean;
  onClose: () => void;
  completionLevel: 'bio' | 'story' | 'full';
};

const REWARDS = {
  bio: {
    title: 'Profile Started!',
    description: 'You\'ve taken the first step in sharing your artistic journey.',
    icon: Star,
    color: 'text-yellow-500'
  },
  story: {
    title: 'Story Unlocked!',
    description: 'Your artwork\'s unique narrative is now part of your profile.',
    icon: CheckCircle,
    color: 'text-green-500'
  },
  full: {
    title: 'Profile Mastered!',
    description: 'Congratulations! Your complete profile showcases your artistic identity.',
    icon: Trophy,
    color: 'text-blue-600'
  }
};

export const CompletionReward: React.FC<CompletionRewardProps> = ({
  isVisible,
  onClose,
  completionLevel
}) => {
  const [showReward, setShowReward] = useState(false);
  const reward = REWARDS[completionLevel];
  const RewardIcon = reward.icon;

  useEffect(() => {
    if (isVisible) {
      setShowReward(true);
      const timer = setTimeout(() => {
        setShowReward(false);
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!showReward) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <button
            onClick={() => {
              setShowReward(false);
              onClose();
            }}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            aria-label="Close reward"
          >
            ✕
          </button>

          <motion.div
            className={`mb-6 flex items-center justify-center ${reward.color}`}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.7 }}
          >
            <RewardIcon size={100} strokeWidth={1} />
          </motion.div>

          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            {reward.title}
          </h2>

          <p className="text-gray-600 mb-6">
            {reward.description}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => {
                setShowReward(false);
                onClose();
              }}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompletionReward; 