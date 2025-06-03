import { useEffect, useRef } from 'react';

interface CRTEffectProps {
  children: React.ReactNode;
}

export const CRTEffect: React.FC<CRTEffectProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add subtle flickering effect
    const flickerInterval = setInterval(() => {
      const brightness = 0.95 + Math.random() * 0.1;
      container.style.filter = `brightness(${brightness})`;
    }, 100);

    return () => clearInterval(flickerInterval);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {children}
      <div className="pointer-events-none fixed inset-0 z-[100]">
        {/* Scanlines */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent bg-[length:100%_4px] animate-scan"></div>
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-radial-gradient opacity-50"></div>
        
        {/* Screen curvature */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/5"></div>
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-noise"></div>
      </div>
    </div>
  );
}; 