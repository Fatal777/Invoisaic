import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

interface WatermarkAnimationProps {
  decision: 'APPROVED' | 'REJECTED';
  show: boolean;
  onComplete?: () => void;
}

/**
 * Watermark Animation Component
 * Shows animated APPROVED/REJECTED watermark overlay
 */
export const WatermarkAnimation: React.FC<WatermarkAnimationProps> = ({ decision, show, onComplete }) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);

    if (show) {
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: -30 }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <div className={`px-16 py-10 rounded-2xl border-8 backdrop-blur-sm ${
            decision === 'APPROVED'
              ? 'bg-green-600/10 border-green-600 text-green-400'
              : 'bg-[#F97272]/10 border-[#F97272] text-[#F76B5E]'
          }`}>
            {decision === 'APPROVED' ? (
              <CheckCircle className="w-40 h-40 mx-auto mb-6 animate-pulse" />
            ) : (
              <XCircle className="w-40 h-40 mx-auto mb-6 animate-pulse" />
            )}
            <div className="text-7xl font-black tracking-wider text-center">
              {decision}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
