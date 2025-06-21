'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, Send, CheckCircle } from 'lucide-react';

type FeedbackModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/vendor/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating,
          feedback,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(onClose, 2000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      // Optionally show error to user
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative"
        >
          {!submitted ? (
            <>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close feedback"
              >
                ✕
              </button>

              <div className="text-center mb-6">
                <MessageCircle 
                  size={64} 
                  className="mx-auto mb-4 text-blue-500" 
                />
                <h2 className="text-2xl font-bold text-gray-800">
                  Help Us Improve
                </h2>
                <p className="text-gray-600 mt-2">
                  How was your profile creation experience?
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((starRating) => (
                    <Star
                      key={starRating}
                      size={32}
                      className={`cursor-pointer transition-colors ${
                        starRating <= rating 
                          ? 'text-yellow-500 fill-current' 
                          : 'text-gray-300'
                      }`}
                      onClick={() => setRating(starRating)}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {rating ? `${rating}/5 Rating` : 'Click to rate'}
                </p>
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts about the profile wizard (optional)"
                className="w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />

              <div className="text-right text-sm text-gray-500 mt-1">
                {feedback.length}/500
              </div>

              <button
                onClick={handleSubmit}
                disabled={rating === 0}
                className={`w-full mt-4 py-3 rounded-lg transition-colors ${
                  rating === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Send size={20} className="mr-2" />
                  Submit Feedback
                </div>
              </button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-green-500 mb-4">
                <CheckCircle size={64} className="mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Thank You!
              </h2>
              <p className="text-gray-600">
                Your feedback helps us improve the artist experience.
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedbackModal; 