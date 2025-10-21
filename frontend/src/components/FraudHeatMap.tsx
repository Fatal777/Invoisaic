import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';

export interface RiskArea {
  id: string;
  x: number; // 0-1 normalized
  y: number;
  width: number;
  height: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  score: number; // 0-100
  page: number;
}

interface FraudHeatMapProps {
  riskAreas: RiskArea[];
  canvasWidth: number;
  canvasHeight: number;
  currentPage: number;
}

/**
 * Fraud Heat Map Component
 * Overlays color-coded risk areas on PDF with hover tooltips
 */
export const FraudHeatMap: React.FC<FraudHeatMapProps> = ({
  riskAreas,
  canvasWidth,
  canvasHeight,
  currentPage
}) => {
  const pageRiskAreas = riskAreas.filter(area => area.page === currentPage);

  const getRiskColor = (level: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (level) {
      case 'HIGH':
        return 'rgba(239, 68, 68, 0.3)'; // Red with transparency
      case 'MEDIUM':
        return 'rgba(251, 191, 36, 0.3)'; // Yellow with transparency
      case 'LOW':
        return 'rgba(34, 197, 94, 0.3)'; // Green with transparency
    }
  };

  const getBorderColor = (level: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (level) {
      case 'HIGH':
        return '#ef4444';
      case 'MEDIUM':
        return '#fbbf24';
      case 'LOW':
        return '#22c55e';
    }
  };

  const getRiskIcon = (level: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (level) {
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-[#F76B5E]" />;
      case 'MEDIUM':
        return <Shield className="w-4 h-4 text-yellow-400" />;
      case 'LOW':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  if (pageRiskAreas.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {pageRiskAreas.map((area) => {
        const pixelX = area.x * canvasWidth;
        const pixelY = area.y * canvasHeight;
        const pixelWidth = area.width * canvasWidth;
        const pixelHeight = area.height * canvasHeight;

        return (
          <motion.div
            key={area.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute group pointer-events-auto"
            style={{
              left: `${pixelX}px`,
              top: `${pixelY}px`,
              width: `${pixelWidth}px`,
              height: `${pixelHeight}px`,
              backgroundColor: getRiskColor(area.riskLevel),
              border: `2px solid ${getBorderColor(area.riskLevel)}`,
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Pulse animation for high risk */}
            {area.riskLevel === 'HIGH' && (
              <div
                className="absolute inset-0 rounded animate-ping"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.5)',
                  animationDuration: '2s'
                }}
              />
            )}

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  {getRiskIcon(area.riskLevel)}
                  <span className="text-xs font-bold text-white uppercase">
                    {area.riskLevel} Risk
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {area.score}%
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {area.reason}
                </p>
              </div>
              {/* Arrow */}
              <div
                className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
