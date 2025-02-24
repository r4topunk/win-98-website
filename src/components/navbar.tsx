import { useState, useEffect } from "react";

interface NavbarProps {
  openStartMenu: () => void;
}

export function Navbar({ openStartMenu }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="window h-8">
      <div className="title-bar-text mr-0! flex justify-between items-center p-0.5">
        <button
          className="px-4 py-1 flex gap-2 items-center"
          onClick={openStartMenu}
        >
          <img src="/icons/windows_slanted-0.png" alt="Windows logo" />
          Start
        </button>
        <button className="active font-medium">
          {formatTime(currentTime)}
        </button>
      </div>
    </div>
  );
}
