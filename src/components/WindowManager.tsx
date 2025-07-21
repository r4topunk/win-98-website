import { useWindowContext } from "../contexts/WindowContext";
import { Window } from "./Window";

export function WindowManager() {
  const { windows, closeWindow, focusWindow, activeWindowId } = useWindowContext();

  return (
    <>
      {windows.map((window) => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          isOpen={window.isOpen && !window.isMinimized}
          position={window.position}
          size={window.size}
          onClose={() => closeWindow(window.id)}
          onFocus={() => focusWindow(window.id)}
          isActive={activeWindowId === window.id}
          style={{ zIndex: window.zIndex || 10 }}
        >
          {window.content}
        </Window>
      ))}
    </>
  );
}
