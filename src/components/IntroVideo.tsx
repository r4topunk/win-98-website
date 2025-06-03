import { useState, useEffect } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

export const IntroVideo = ({ onComplete }: IntroVideoProps) => {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // const lastShown = localStorage.getItem('introLastShown');
    const now = new Date().getTime();
    
    // if (!lastShown || now - parseInt(lastShown) > 3600000) { // 1 hour in milliseconds
      setShowVideo(true);
      localStorage.setItem('introLastShown', now.toString());
    // }
  }, []);

  if (!showVideo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        className="w-full h-full object-cover"
        autoPlay
        controls={false}
        onEnded={onComplete}
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>
      <button
        onClick={onComplete}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full backdrop-blur-sm transition-all"
      >
        Pular
      </button>
    </div>
  );
}; 