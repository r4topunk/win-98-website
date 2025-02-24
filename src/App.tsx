import { useEffect, useState } from "react";
import { cn } from "./utils/cn";
import { Navbar } from "./components/navbar";
import { Desktop } from "./components/desktop";

function App() {
  const [count, setCount] = useState(0);
  const [modalActive, setModalActive] = useState(false);

  const playSound = () => {
    const sound = new Audio("/mouse-click.wav");
    sound.volume = 0.75;
    sound.play();
  };

  useEffect(() => {
    document.body.style.zoom = "1.25";
    const handleClick = () => playSound();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="bg-[url('/bg.jpg')] bg-cover bg-no-repeat bg-center relative overflow-hidden flex flex-col h-[80vh]">
      <Desktop />
      <Navbar openStartMenu={() => setModalActive(true)} />
      <div
        className={cn(
          "window max-w-80 top-1/2 left-1/2 absolute transform -translate-x-1/2 -translate-y-1/2",
          { hidden: !modalActive }
        )}
      >
        <div className="title-bar">
          <div className="title-bar-text">Counter</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" />
            <button aria-label="Maximize" />
            <button
              aria-label="Close"
              onClick={() => {
                setModalActive(false);
              }}
            />
          </div>
        </div>
        <div className="window-body">
          <p style={{ textAlign: "center" }}>Current count: {count}</p>
          <div className="field-row" style={{ justifyContent: "center" }}>
            <button
              onClick={() => {
                setCount(count + 1);
              }}
            >
              +
            </button>
            <button
              onClick={() => {
                setCount(count - 1);
              }}
            >
              -
            </button>
            <button
              onClick={() => {
                setCount(0);
              }}
            >
              0
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
