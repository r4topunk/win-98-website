import { useEffect, useState } from "react";
import { cn } from "./utils/cn";

function App() {
  const [count, setCount] = useState(0);
  const [modalActive, setModalActive] = useState(false);

  useEffect(() => {
    document.body.style.zoom = "1.25";
  }, []);

  const playSound = () => {
    const sound = new Audio("/mouse-click.wav");
    sound.volume = 0.5;
    sound.play();
  };

  return (
    <div className="h-[80vh] bg-[#008080] relative overflow-hidden flex items-start p-1">
      <button
        className="flex flex-col gap-1 items-center p-2! bg-transparent! shadow-none! cursor-pointer"
        onClick={playSound}
      >
        <img
          src="/icons/computer_explorer_cool-0.png"
          alt="Computer"
          width={32}
          className="pointer-events-none"
        />
        <p className="font-['Pixelated MS Sans Serif'] text-white font-light!">
          My Computer
        </p>
      </button>
      <div
        className={cn(
          "window max-w-80 top-1/2 left-1/2 absolute transform -translate-x-1/2 -translate-y-1/2",
          { hidden: !modalActive }
        )}
      >
        <div className="title-bar">
          <div className="title-bar-text">Counter</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" onClick={playSound} />
            <button aria-label="Maximize" onClick={playSound} />
            <button
              aria-label="Close"
              onClick={() => {
                playSound();
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
                playSound();
                setCount(count + 1);
              }}
            >
              +
            </button>
            <button
              onClick={() => {
                playSound();
                setCount(count - 1);
              }}
            >
              -
            </button>
            <button
              onClick={() => {
                playSound();
                setCount(0);
              }}
            >
              0
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 window">
        <div className="title-bar-text mr-0! flex justify-between items-center p-0.5">
          <button
            className="px-4 py-1 flex gap-2 items-center"
            onClick={() => {
              playSound();
              setModalActive((active) => !active);
            }}
          >
            <img src="/icons/windows_slanted-0.png" alt="Windows logo" />
            Start
          </button>
          <button className="active font-medium" onClick={playSound}>
            4:20 PM
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
