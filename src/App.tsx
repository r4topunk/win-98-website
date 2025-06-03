import { useEffect, useState } from "react";
import { Navbar } from "./components/navbar";
import { Desktop } from "./components/desktop";
import { Modal } from "./components/Modal";
import { useModal } from "./hooks/useModal";
import { WindowProvider } from "./contexts/WindowContext";
import { WindowManager } from "./components/WindowManager";
import { IntroVideo } from "./components/IntroVideo";
import { VintageTransition } from "./components/VintageTransition";
import { CRTEffect } from "./components/CRTEffect";

function App() {
  const { isOpen, open, close } = useModal(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showTransition, setShowTransition] = useState(false);

  const playSound = () => {
    const sound = new Audio("/mouse-click.wav");
    sound.volume = 0.75;
    sound.play();
  };

  useEffect(() => {
    const handleClick = () => playSound();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleIntroComplete = () => {
    setShowTransition(true);
  };

  const handleTransitionComplete = () => {
    setShowIntro(false);
    setShowTransition(false);
  };

  return (
    <WindowProvider>
      {showIntro && <IntroVideo onComplete={handleIntroComplete} />}
      {showTransition && <VintageTransition onComplete={handleTransitionComplete} />}
      <CRTEffect>
        <div className="bg-[url('/bg.jpg')] bg-cover bg-no-repeat bg-center relative overflow-hidden flex flex-col h-[100dvh] md:h-[80vh]">
          <Desktop />
          <WindowManager />
          <Navbar openStartMenu={open} />
          <Modal isOpen={isOpen} onClose={close} title="Start Menu">
            <div className="p-2">
              <button
                onClick={() => {
                  const videoContainer = document.createElement('div');
                  videoContainer.className = 'fixed inset-0 z-[50] bg-black flex items-center justify-center';
                  
                  const videoWrapper = document.createElement('div');
                  videoWrapper.className = 'w-full h-auto max-h-full';
                  
                  const video = document.createElement('video');
                  video.src = '/intro.webm';
                  video.style.position = 'relative';
                  video.style.width = '100%';
                  video.style.height = 'auto';
                  video.style.objectFit = 'contain';
                  
                  // Add CRT effect elements
                  const crtOverlay = document.createElement('div');
                  crtOverlay.className = 'pointer-events-none fixed inset-0 z-[51]';
                  crtOverlay.innerHTML = `
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent bg-[length:100%_4px] animate-scan"></div>
                    <div class="absolute inset-0 bg-radial-gradient opacity-50"></div>
                    <div class="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/5"></div>
                    <div class="absolute inset-0 opacity-[0.03] bg-noise"></div>
                  `;
                  
                  videoWrapper.appendChild(video);
                  videoContainer.appendChild(videoWrapper);
                  videoContainer.appendChild(crtOverlay);
                  
                  // Add flickering effect
                  const flickerInterval = setInterval(() => {
                    const brightness = 0.95 + Math.random() * 0.1;
                    video.style.filter = `brightness(${brightness})`;
                  }, 100);
                  
                  video.onended = () => {
                    clearInterval(flickerInterval);
                    const transition = document.createElement('div');
                    transition.className = 'fixed inset-0 z-[60] pointer-events-none transition-opacity duration-500';
                    transition.innerHTML = `
                      <div class="absolute inset-0 bg-black"></div>
                      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-scan"></div>
                      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-flicker"></div>
                      <div class="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent animate-fade"></div>
                    `;
                    document.body.appendChild(transition);
                    setTimeout(() => {
                      document.body.removeChild(videoContainer);
                      setTimeout(() => {
                        document.body.removeChild(transition);
                      }, 500);
                    }, 100);
                  };
                  
                  document.body.appendChild(videoContainer);
                  video.play();
                  close();
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 rounded transition-colors"
              >
                Play Intro Video
              </button>
            </div>
          </Modal>
        </div>
      </CRTEffect>
    </WindowProvider>
  );
}

export default App;
