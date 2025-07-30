import { useState, useEffect } from "react";
import { useWindowContext } from "../contexts/WindowContext";

interface NavbarProps {
  openStartMenu: () => void;
}

export function Navbar({ openStartMenu }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { windows, restoreWindow, focusWindow } = useWindowContext();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };


  const handleWindowClick = (windowId: string, isMinimized: boolean) => {
    if (isMinimized) {
      restoreWindow(windowId);
    } else {
      focusWindow(windowId);
    }
  };

  return (
    <div className="window h-8">
      <div className="title-bar-text mr-0! flex justify-between items-center p-0.5">
        <div className="flex items-center gap-1">
          <button
            className="px-4 py-1 flex gap-2 items-center"
            onClick={openStartMenu}
          >
            <img src="/icons/windows_slanted-0.png" alt="Windows logo" />
            Start
          </button>
          
          {/* Taskbar buttons for all open windows */}
          {windows.filter(w => w.isOpen).map((window) => (
            <button
              key={window.id}
              className={`px-2 py-1 text-xs truncate max-w-32 ${
                window.isMinimized ? 'pressed' : 'active'
              }`}
              onClick={() => handleWindowClick(window.id, window.isMinimized)}
              title={window.title}
            >
              {window.title}
            </button>
          ))}
        </div>
        
        <button className="active font-medium">
          {formatTime(currentTime)}
        </button>
      </div>
    </div>
  );
}
