import { useState, useEffect, useRef } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

export const IntroVideo = ({ onComplete }: IntroVideoProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const now = new Date().getTime();
    setShowVideo(true);
    localStorage.setItem('introLastShown', now.toString());
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      video.play().catch((err) => {
        console.error('Error playing video:', err);
        setError(true);
      });
    };

    const handleError = () => {
      setError(true);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    // Add flickering effect
    const flickerInterval = setInterval(() => {
      const brightness = 0.95 + Math.random() * 0.1;
      video.style.filter = `brightness(${brightness})`;
    }, 100);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      clearInterval(flickerInterval);
    };
  }, []);

  if (!showVideo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-full max-h-full flex items-center justify-center relative">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p>Failed to load video. Please try again.</p>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full max-w-full max-h-full object-contain"
          autoPlay
          controls={false}
          onEnded={onComplete}
          playsInline
          preload="auto"
          muted
        >
          <source src={`/intro.webm?t=${Date.now()}`} type="video/webm" />
          <source src={`/intro.mp4?t=${Date.now()}`} type="video/mp4" />
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
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full backdrop-blur-sm transition-all z-[52]"
        >
          Pular
        </button>
      </div>
    </div>
  );
}; 