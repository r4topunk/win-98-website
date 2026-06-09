import { useState, useEffect, useRef } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

export const IntroVideo = ({ onComplete }: IntroVideoProps) => {
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // If the video fails to load (missing /intro.webm, codec issue, network
  // error), don't trap the visitor on a black screen — auto-advance past the
  // intro after 1.5 s so the desktop is reachable.
  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(onComplete, 1500);
    return () => clearTimeout(timeout);
  }, [error, onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setPlaybackRate = () => {
      video.playbackRate = 2.0;
    };

    const handleCanPlay = () => {
      setPlaybackRate();
      // Ensure autoplay works on mobile by attempting play immediately
      video.play().then(() => {
        setPlaybackRate();
      }).catch(() => {
        // On mobile, sometimes we need to retry play after a brief delay
        setTimeout(() => {
          video.play().then(() => {
            setPlaybackRate();
          }).catch(() => setError(true));
        }, 100);
      });
    };

    const handlePlay = () => {
      setPlaybackRate();
    };

    const handleLoadedData = () => {
      setPlaybackRate();
    };

    const handleError = () => {
      setError(true);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    // Add flickering effect
    const flickerInterval = setInterval(() => {
      const brightness = 0.95 + Math.random() * 0.1;
      video.style.filter = `brightness(${brightness})`;
    }, 100);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      clearInterval(flickerInterval);
    };
  }, []);


  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-full max-h-full flex items-center justify-center relative">
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2 text-center px-6">
            <p>Falha ao carregar o vídeo.</p>
            <p className="text-sm opacity-80">Abrindo a área de trabalho…</p>
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
          aria-label="Skip intro"
          // bottom-12 keeps the button clear of iOS Safari's home-bar overlay
          className="fixed bottom-12 left-1/2 transform -translate-x-1/2 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full backdrop-blur-sm transition-all z-[52]"
        >
          Pular · Skip · スキップ
        </button>
      </div>
    </div>
  );
}; 