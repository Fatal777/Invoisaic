import { useState, useCallback } from 'react';

export interface Annotation {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  type: 'field_extraction' | 'validation' | 'fraud_alert' | 'tax_breakdown' | 'general';
  confidence?: number;
  timestamp: Date;
}

interface UseAnnotationsReturn {
  annotations: Annotation[];
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  getAnnotationsByPage: (page: number) => Annotation[];
  getAnnotationsByType: (type: Annotation['type']) => Annotation[];
}

/**
 * Custom hook for managing PDF annotations
 * Handles adding, removing, and filtering annotations
 */
export const useAnnotations = (): UseAnnotationsReturn => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const addAnnotation = useCallback((annotation: Omit<Annotation, 'id' | 'timestamp'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setAnnotations(prev => [...prev, newAnnotation]);

    console.log('Annotation added:', newAnnotation);
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    console.log('Annotation removed:', id);
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    console.log('All annotations cleared');
  }, []);

  const getAnnotationsByPage = useCallback((page: number): Annotation[] => {
    return annotations.filter(a => a.page === page);
  }, [annotations]);

  const getAnnotationsByType = useCallback((type: Annotation['type']): Annotation[] => {
    return annotations.filter(a => a.type === type);
  }, [annotations]);

  return {
    annotations,
    addAnnotation,
    removeAnnotation,
    clearAnnotations,
    getAnnotationsByPage,
    getAnnotationsByType
  };
};
