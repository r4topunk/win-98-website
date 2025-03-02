import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export interface Window {
  id: string;
  title: string;
  content: ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size?: { width: number; height: number };
}

interface WindowContextType {
  windows: Window[];
  openWindow: (
    window: Omit<Window, "isOpen" | "isMinimized" | "position">
  ) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  setWindowPosition: (id: string, position: { x: number; y: number }) => void;
  setWindowSize: (id: string, size: { width: number; height: number }) => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export function WindowProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<Window[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  // Update screen dimensions and mobile status on resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenDimensions({ width, height });
      setIsMobile(width < 768); // Common breakpoint for mobile
    };

    // Set initial values
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getDefaultWindowPosition = () => {
    // Default window size to calculate centering
    const defaultWidth = isMobile
      ? Math.min(320, screenDimensions.width - 20)
      : 300;
    const defaultHeight = isMobile
      ? screenDimensions.height > 500
        ? 400
        : screenDimensions.height - 100
      : 400; // Approximate default height

    // Calculate center position
    const centerX = screenDimensions.width / 2 - defaultWidth / 2;
    const centerY = screenDimensions.height / 2 - defaultHeight / 2;

    // Apply zoom correction if needed
    const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;

    // Add cascade effect for multiple windows
    const offset = windows.length * 20;
    const maxOffset =
      Math.min(screenDimensions.width, screenDimensions.height) * 0.2;
    const limitedOffset = Math.min(offset, maxOffset);

    return {
      x: Math.max(0, centerX / zoom + limitedOffset / zoom),
      y: Math.max(0, centerY / zoom + limitedOffset / zoom),
    };
  };

  const getDefaultWindowSize = () => {
    if (isMobile) {
      // Almost full width on mobile
      return {
        width: Math.min(320, screenDimensions.width - 20),
        height:
          screenDimensions.height > 500 ? 400 : screenDimensions.height - 100,
      };
    }

    return undefined; // Use CSS defaults for desktop
  };

  const openWindow = (
    window: Omit<Window, "isOpen" | "isMinimized" | "position">
  ) => {
    setWindows((prev) => {
      // Check if window already exists
      const existingWindowIndex = prev.findIndex((w) => w.id === window.id);

      if (existingWindowIndex !== -1) {
        // If window exists, just make it visible and bring to front
        const updatedWindows = [...prev];

        // Move the window to the end of the array (top z-index)
        const existingWindow = updatedWindows.splice(existingWindowIndex, 1)[0];
        updatedWindows.push({
          ...existingWindow,
          isOpen: true,
          isMinimized: false,
        });

        return updatedWindows;
      }

      const defaultPosition = getDefaultWindowPosition();
      const defaultSize = getDefaultWindowSize();

      // Otherwise add new window with default position
      return [
        ...prev,
        {
          ...window,
          isOpen: true,
          isMinimized: false,
          position: defaultPosition,
          size: defaultSize,
        },
      ];
    });
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((window) => window.id !== id));
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id ? { ...window, isMinimized: true } : window
      )
    );
  };

  const restoreWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id
          ? { ...window, isMinimized: false, isOpen: true }
          : window
      )
    );
  };

  const setWindowPosition = (
    id: string,
    position: { x: number; y: number }
  ) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id ? { ...window, position } : window
      )
    );
  };

  const setWindowSize = (
    id: string,
    size: { width: number; height: number }
  ) => {
    setWindows((prev) =>
      prev.map((window) => (window.id === id ? { ...window, size } : window))
    );
  };

  return (
    <WindowContext.Provider
      value={{
        windows,
        openWindow,
        closeWindow,
        minimizeWindow,
        restoreWindow,
        setWindowPosition,
        setWindowSize,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
}

export function useWindowContext() {
  const context = useContext(WindowContext);
  if (context === undefined) {
    throw new Error("useWindowContext must be used within a WindowProvider");
  }
  return context;
}
