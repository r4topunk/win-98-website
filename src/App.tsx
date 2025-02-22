import { useEffect, useState } from "react";
import { cn } from "./utils/cn";
import { DesktopIcon } from "./components/desktop-icon";

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
    <div className="bg-[url('/bg.jpg')] bg-cover bg-no-repeat bg-center relative overflow-hidden flex items-start p-1">
      <div className="h-[80vh]">
        <DesktopIcon icon_path="/icons/camera3_vid-2.png" icon_name="Movies" />
        <DesktopIcon icon_path="/icons/camera3-2.png" icon_name="Images" />
        <DesktopIcon
          icon_path="/icons/computer_explorer_cool-0.png"
          icon_name="Computer"
        />
        <DesktopIcon icon_path="/icons/modem-5.png" icon_name="Contato" />
        <DesktopIcon icon_path="/icons/msagent-3.png" icon_name="Lojinha" />
        <DesktopIcon
          icon_path="/icons/overlay_share_cool-3.png"
          icon_name="???"
        />
        <DesktopIcon
          icon_path="/icons/recycle_bin_full-4.png"
          icon_name="Rejects"
        />
      </div>
      <div className="h-[80vh]">
        <DesktopIcon icon_path="/icons/world-4.png" icon_name="Pelo mundo" />
        <DesktopIcon
          icon_path="/icons/cd_audio_cd_a-3.png"
          icon_name="Album Covers"
        />
        <DesktopIcon
          icon_path="/icons/network_internet_pcs_installer-4.png"
          icon_name="Colabs"
        />
        <DesktopIcon icon_path="/icons/imaggif-1.png" icon_name="Desenhe" />
        <DesktopIcon icon_path="/icons/hardware-4.png" icon_name="W.I.P." />
      </div>
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
