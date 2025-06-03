import { useState, useEffect, useRef } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

export const IntroVideo = ({ onComplete }: IntroVideoProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // const lastShown = localStorage.getItem('introLastShown');
    const now = new Date().getTime();
    
    // if (!lastShown || now - parseInt(lastShown) > 3600000) { // 1 hour in milliseconds
      setShowVideo(true);
      localStorage.setItem('introLastShown', now.toString());
    // }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Add flickering effect
    const flickerInterval = setInterval(() => {
      const brightness = 0.95 + Math.random() * 0.1;
      video.style.filter = `brightness(${brightness})`;
    }, 100);

    return () => clearInterval(flickerInterval);
  }, []);

  if (!showVideo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-full h-auto max-h-full">
        <video
          ref={videoRef}
          className="w-full h-auto object-contain"
          autoPlay
          controls={false}
          onEnded={onComplete}
        >
          <source src="/intro.webm" type="video/webm" />
        </video>
        
        {/* CRT Effect Overlay */}
        <div className="pointer-events-none fixed inset-0 z-[51]">
          {/* Scanlines */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent bg-[length:100%_4px] animate-scan"></div>
          
          {/* Vignette effect */}
          <div className="absolute inset-0 bg-radial-gradient opacity-50"></div>
          
          {/* Screen curvature */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/5"></div>
          
          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-noise"></div>
        </div>

        <button
          onClick={onComplete}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full backdrop-blur-sm transition-all z-[52]"
        >
          Pular
        </button>
      </div>
    </div>
  );
}; 