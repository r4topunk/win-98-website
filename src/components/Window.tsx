import React, {
  ReactNode,
  useState,
  useRef,
  useEffect,
  CSSProperties,
} from "react";
import { useWindowContext } from "../contexts/WindowContext";
import { cn } from "../utils/cn";

interface WindowProps {
  id: string;
  title: string;
  children: ReactNode;
  isOpen: boolean;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  onClose: () => void;
  style?: CSSProperties;
}

export function Window({
  id,
  title,
  children,
  isOpen,
  position,
  size,
  onClose,
  style = {},
}: WindowProps) {
  const { setWindowPosition, minimizeWindow } = useWindowContext();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Get zoom level from document body (will be 1 if no zoom is applied)
  const getZoomLevel = () => {
    // Get the current zoom level - fallback to 1 if not set
    const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
    return zoom;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the title bar
    if ((e.target as HTMLElement).closest(".title-bar")) {
      setIsDragging(true);
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        const zoom = getZoomLevel();
        // Adjust for zoom by dividing coordinates by zoom factor
        setDragOffset({
          x: e.clientX / zoom - rect.left / zoom,
          y: e.clientY / zoom - rect.top / zoom,
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && windowRef.current) {
      const zoom = getZoomLevel();
      // Apply zoom correction
      const newX = e.clientX / zoom - dragOffset.x;
      const newY = e.clientY / zoom - dragOffset.y;

      // Get container bounds to constrain window position
      const container = document.querySelector(
        ".bg-\\[url\\(\\'\\/bg\\.jpg\\'\\)\\]"
      );
      const containerRect = container?.getBoundingClientRect();

      // Constrain position within visible area
      let constrainedX = newX;
      let constrainedY = newY;

      if (containerRect) {
        const windowWidth = windowRef.current.offsetWidth;
        const windowHeight = windowRef.current.offsetHeight;

        // Don't let window go completely off-screen
        constrainedX = Math.max(
          -(windowWidth * 0.75),
          Math.min(
            constrainedX,
            containerRect.width / zoom - windowWidth * 0.25
          )
        );
        constrainedY = Math.max(
          0,
          Math.min(constrainedY, containerRect.height / zoom - 50)
        ); // Keep title bar visible
      }

      setWindowPosition(id, { x: constrainedX, y: constrainedY });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".title-bar")) {
      setIsDragging(true);
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect && e.touches[0]) {
        const zoom = getZoomLevel();
        const touch = e.touches[0];
        setDragOffset({
          x: touch.clientX / zoom - rect.left / zoom,
          y: touch.clientY / zoom - rect.top / zoom,
        });
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && windowRef.current && e.touches[0]) {
      e.preventDefault(); // Prevent scrolling while dragging
      const zoom = getZoomLevel();
      const touch = e.touches[0];
      const newX = touch.clientX / zoom - dragOffset.x;
      const newY = touch.clientY / zoom - dragOffset.y;

      // Apply constraints as in handleMouseMove
      const container = document.querySelector(
        ".bg-\\[url\\(\\'\\/bg\\.jpg\\'\\)\\]"
      );
      const containerRect = container?.getBoundingClientRect();

      let constrainedX = newX;
      let constrainedY = newY;

      if (containerRect) {
        const windowWidth = windowRef.current.offsetWidth;
        const windowHeight = windowRef.current.offsetHeight;

        constrainedX = Math.max(
          -(windowWidth * 0.75),
          Math.min(
            constrainedX,
            containerRect.width / zoom - windowWidth * 0.25
          )
        );
        constrainedY = Math.max(
          0,
          Math.min(constrainedY, containerRect.height / zoom - 50)
        );
      }

      setWindowPosition(id, { x: constrainedX, y: constrainedY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      className={cn("window absolute shadow-md", { "z-50": isDragging })}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: size?.width ? `${size.width}px` : "300px",
        height: size?.height ? `${size.height}px` : "auto",
        maxWidth: "100%",
        maxHeight: "calc(100% - 30px)",
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="title-bar cursor-move">
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" onClick={() => minimizeWindow(id)} />
          <button aria-label="Maximize" />
          <button aria-label="Close" onClick={onClose} />
        </div>
      </div>
      <div
        className="window-body"
        style={{
          overflow: "auto",
          maxHeight: "calc(100vh - 100px)",
          padding: "0.5rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}
