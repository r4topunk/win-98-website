import { useWindowContext } from "../contexts/WindowContext";
import { Window } from "./Window";

export function WindowManager() {
  const { windows, closeWindow } = useWindowContext();

  return (
    <>
      {windows.map((window, index) => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          isOpen={window.isOpen && !window.isMinimized}
          position={window.position}
          size={window.size}
          onClose={() => closeWindow(window.id)}
          style={{ zIndex: index + 10 }} // Apply increasing z-index based on order
        >
          {window.content}
        </Window>
      ))}
    </>
  );
}
