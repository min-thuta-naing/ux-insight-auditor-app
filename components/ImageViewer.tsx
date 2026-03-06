import React, { useState, useRef, useEffect } from 'react';
import { Finding } from '../types';

interface ImageViewerProps {
  imageSrc: string;
  findings: Finding[];
  selectedFindingId?: string;
  onSelectFinding: (id: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageSrc, findings, selectedFindingId, onSelectFinding }) => {
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgSize({
        width: imgRef.current.offsetWidth,
        height: imgRef.current.offsetHeight,
      });
    }
  };

  useEffect(() => {
    // Recalculate size on window resize
    const handleResize = () => {
      if (imgRef.current) {
        setImgSize({
          width: imgRef.current.offsetWidth,
          height: imgRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getColors = (severity: string, category: string) => {
    if (category === 'WCAG') {
      // Cool colors for Accessibility
      return {
        border: '#8b5cf6', // violet-500
        bg: 'rgba(139, 92, 246, 0.2)',
        text: '#7c3aed' // violet-600
      };
    }
    // Warm/Standard colors for UX
    switch (severity) {
      case 'Critical': return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', text: '#dc2626' };
      case 'High': return { border: '#f97316', bg: 'rgba(249, 115, 22, 0.2)', text: '#ea580c' };
      case 'Medium': return { border: '#eab308', bg: 'rgba(234, 179, 8, 0.2)', text: '#ca8a04' };
      default: return { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', text: '#2563eb' };
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center min-h-[400px]">
      <div className="relative inline-block max-w-full">
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Analyzed UI"
          className="max-h-[600px] w-auto block object-contain"
          onLoad={handleImageLoad}
        />

        {/* SVG Overlay */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {findings.map((f) => {
            // Convert 0-1000 coordinate system to percentages
            const top = (f.location_box.ymin / 1000) * 100;
            const left = (f.location_box.xmin / 1000) * 100;
            const width = ((f.location_box.xmax - f.location_box.xmin) / 1000) * 100;
            const height = ((f.location_box.ymax - f.location_box.ymin) / 1000) * 100;

            const isSelected = selectedFindingId === f.id;
            const isDimmed = !!selectedFindingId && !isSelected;
            const colors = getColors(f.severity, f.category);

            const borderColor = isSelected ? `2px solid white` : `2px solid ${colors.border}`;
            const bgColor = isSelected ? `rgba(255, 255, 255, 0.3)` : 'transparent';
            const shadow = isSelected ? '0 0 10px rgba(0,0,0,0.5)' : 'none';

            return (
              <div
                key={f.id}
                className={`absolute transition-all duration-200 pointer-events-auto cursor-pointer hover:bg-white/10 group ${isDimmed ? 'opacity-20 blur-[1px]' : 'opacity-100'}`}
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  border: borderColor,
                  backgroundColor: bgColor,
                  boxShadow: shadow,
                  zIndex: isSelected ? 20 : 10,
                }}
                onClick={() => onSelectFinding(f.id)}
              >
                <span
                  className={`absolute ${top < 5 ? 'top-full mt-1' : 'bottom-full mb-1'} left-0 whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded text-white font-bold transition-opacity shadow-sm ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  style={{
                    backgroundColor: colors.border,
                    zIndex: 30
                  }}
                >
                  {f.category === 'WCAG' ? '♿ ' : ''}{f.id}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};