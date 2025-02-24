import { useEffect, useState } from "react";
import { Navbar } from "./components/navbar";
import { Desktop } from "./components/desktop";
import { Modal } from "./components/Modal";
import { useModal } from "./hooks/useModal";

function App() {
  const [count, setCount] = useState(0);
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
    <div className="bg-[url('/bg.jpg')] bg-cover bg-no-repeat bg-center relative overflow-hidden flex flex-col h-[100dvh] md:h-[80vh]">
      <Desktop />
      <Navbar openStartMenu={open} />
      <Modal isOpen={isOpen} onClose={close} title="Counter">
        <p style={{ textAlign: "center" }}>Current count: {count}</p>
        <div className="field-row" style={{ justifyContent: "center" }}>
          <button onClick={() => setCount(count + 1)}>+</button>
          <button onClick={() => setCount(count - 1)}>-</button>
          <button onClick={() => setCount(0)}>0</button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
