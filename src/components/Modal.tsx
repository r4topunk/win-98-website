import { ReactNode } from "react";
import { cn } from "../utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <div
      className={cn(
        "window max-w-80 top-1/2 left-1/2 absolute transform -translate-x-1/2 -translate-y-1/2",
        { hidden: !isOpen }
      )}
    >
      <div className="title-bar">
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" />
          <button aria-label="Maximize" />
          <button aria-label="Close" onClick={onClose} />
        </div>
      </div>
      <div className="window-body">{children}</div>
    </div>
  );
}
