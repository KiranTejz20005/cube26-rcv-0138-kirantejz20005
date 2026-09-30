'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{ url: string; label?: string }>;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function ImageModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
}: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onIndexChange(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onIndexChange(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onIndexChange]);

  if (!isOpen || images.length === 0) return null;

  const activeImage = images[currentIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        aria-label="Close image viewer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev Button */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={() => onIndexChange(currentIndex - 1)}
          className="absolute left-4 p-2 rounded-lg bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image Container */}
      <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage.url}
          alt={activeImage.label || 'Inspection Evidence Image'}
          className="max-w-full max-h-[75vh] object-contain rounded-lg border border-gray-800"
        />
        {activeImage.label && (
          <div className="mt-3 bg-gray-900 border border-gray-800 px-4 py-1.5 rounded text-xs text-gray-300 font-mono">
            {activeImage.label}
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500 font-mono">
          Image {currentIndex + 1} of {images.length}
        </div>
      </div>

      {/* Next Button */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={() => onIndexChange(currentIndex + 1)}
          className="absolute right-4 p-2 rounded-lg bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
