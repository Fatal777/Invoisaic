/**
 * Guided Tour Component
 * Interactive tutorial system with tooltips and step-by-step guidance
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  highlight?: boolean;
}

interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentStepIndex?: number;
  onStepChange?: (index: number) => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip,
  currentStepIndex = 0,
  onStepChange,
}) => {
  const [activeStep, setActiveStep] = useState(currentStepIndex);
  const [targetPosition, setTargetPosition] = useState<DOMRect | null>(null);

  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  useEffect(() => {
    if (currentStep?.target && isActive) {
      const element = document.querySelector(currentStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetPosition(rect);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetPosition(null);
    }
  }, [activeStep, currentStep, isActive]);

  useEffect(() => {
    setActiveStep(currentStepIndex);
  }, [currentStepIndex]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      onStepChange?.(nextStep);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStep = activeStep - 1;
      setActiveStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const getTooltipPosition = () => {
    if (!targetPosition || !currentStep.position) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const padding = 30;
    switch (currentStep.position) {
      case 'top':
        return {
          top: `${targetPosition.top - padding}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: `${targetPosition.bottom + padding}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.left - padding}px`,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.right + padding}px`,
          transform: 'translate(0, -50%)',
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const getArrowPosition = () => {
    if (!currentStep.position) return '';
    
    switch (currentStep.position) {
      case 'top':
        return 'bottom-[-8px] left-1/2 -translate-x-1/2 border-b-0 border-r-0';
      case 'bottom':
        return 'top-[-8px] left-1/2 -translate-x-1/2 border-t-0 border-r-0';
      case 'left':
        return 'right-[-8px] top-1/2 -translate-y-1/2 border-l-0 border-b-0';
      case 'right':
        return 'left-[-8px] top-1/2 -translate-y-1/2 border-r-0 border-t-0';
      default:
        return '';
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* Dark overlay with cutout for highlighted element */}
        {currentStep.highlight && targetPosition && (
          <>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none">
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <mask id="spotlight-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={targetPosition.left - 12}
                      y={targetPosition.top - 12}
                      width={targetPosition.width + 24}
                      height={targetPosition.height + 24}
                      rx="16"
                      fill="black"
                    />
                  </mask>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <rect width="100%" height="100%" mask="url(#spotlight-mask)" fill="black" opacity="0.7" />
              </svg>
            </div>
            
            {/* Animated pulsing border around highlighted element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              className="absolute pointer-events-none"
              style={{
                left: targetPosition.left - 12,
                top: targetPosition.top - 12,
                width: targetPosition.width + 24,
                height: targetPosition.height + 24,
              }}
            >
              {/* Outer glow */}
              <motion.div 
                className="absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(239, 68, 68, 0.4)',
                    '0 0 0 8px rgba(239, 68, 68, 0)',
                    '0 0 0 0 rgba(239, 68, 68, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              
              {/* Border */}
              <div className="absolute inset-0 rounded-2xl border-3 border-[#FEF5F4]0 shadow-lg shadow-[#F97272]/50">
                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#FEF5F4]0 rounded-tl-2xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#FEF5F4]0 rounded-tr-2xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#FEF5F4]0 rounded-bl-2xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#FEF5F4]0 rounded-br-2xl" />
              </div>
              
              {/* Inner subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FEF5F4]0/10 via-transparent to-[#EFA498]/10 rounded-2xl animate-pulse" />
            </motion.div>
          </>
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute pointer-events-auto"
          style={getTooltipPosition()}
        >
          {/* Arrow indicator */}
          {targetPosition && currentStep.position && currentStep.position !== 'center' && (
            <div className={`absolute ${getArrowPosition()} w-4 h-4 bg-white transform rotate-45 border-t-2 border-l-2 border-[#F97272] shadow-lg`} />
          )}
          
          <motion.div 
            className="bg-gradient-to-br from-white to-gray-50 border-2 border-[#F97272] rounded-2xl shadow-2xl max-w-md overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {/* Decorative gradient bar */}
            <div className="h-1 bg-gradient-to-r from-[#F97272] via-[#EFA498] to-[#F97272]" />
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-[#F97272] to-[#f85c5c] rounded-xl flex items-center justify-center shadow-lg shadow-[#F97272]/30"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                    {currentStep.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {steps.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === activeStep 
                              ? 'w-6 bg-[#F97272]' 
                              : idx < activeStep
                                ? 'w-4 bg-[#F76B5E]'
                                : 'w-2 bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {activeStep + 1} of {steps.length}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onSkip}
                className="p-2 hover:bg-[#FEF5F4] rounded-lg transition-colors group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-[#F97272] transition-colors" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 bg-white">
              <p className="text-gray-700 leading-relaxed mb-6 text-base">{currentStep.description}</p>

              {/* Custom Action Button */}
              {currentStep.action && (
                <button
                  onClick={currentStep.action.onClick}
                  className="w-full mb-4 px-4 py-3 bg-[#F97272] hover:bg-[#f85c5c] rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {currentStep.action.label}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-600 font-medium mb-2">
                  <span>Tour Progress</span>
                  <span className="text-[#F97272]">{Math.round(((activeStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="h-full bg-gradient-to-r from-[#F97272] via-[#EFA498] to-[#F97272] rounded-full shadow-lg"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                <motion.button
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  whileHover={{ scale: isFirstStep ? 1 : 1.05 }}
                  whileTap={{ scale: isFirstStep ? 1 : 0.95 }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded-lg font-semibold transition-all flex items-center gap-2 text-gray-700 disabled:hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </motion.button>

                <button
                  onClick={onSkip}
                  className="px-4 py-2 text-gray-500 hover:text-[#F97272] transition-colors text-sm font-medium"
                >
                  Skip Tour
                </button>

                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#F97272] to-[#f85c5c] hover:from-[#f85c5c] hover:to-[#e64545] rounded-lg font-semibold transition-all flex items-center gap-2 text-white shadow-lg shadow-[#F97272]/30"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4" />
                      Finish Tour
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuidedTour;
