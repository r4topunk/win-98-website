import { useEffect } from "react";
import { Navbar } from "./components/navbar";
import { Desktop } from "./components/desktop";
import { Modal } from "./components/Modal";
import { useModal } from "./hooks/useModal";
import { WindowProvider } from "./contexts/WindowContext";
import { WindowManager } from "./components/WindowManager";

function App() {
  const { isOpen, open, close } = useModal(false);

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

  return (
    <WindowProvider>
      <div className="bg-[url('/bg.jpg')] bg-cover bg-no-repeat bg-center relative overflow-hidden flex flex-col h-[100dvh] md:h-[80vh]">
        <Desktop />
        <WindowManager />
        <Navbar openStartMenu={open} />
        <Modal isOpen={isOpen} onClose={close} title="Start Menu">
          <div className="p-2">
            <p>Start Menu Content</p>
          </div>
        </Modal>
      </div>
    </WindowProvider>
  );
}

export default App;
