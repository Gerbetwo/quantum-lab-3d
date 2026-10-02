import React, { useEffect, useState } from "react";

export interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen: externalIsOpen, onClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen ?? internalIsOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setInternalIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        if (onClose) onClose();
        setInternalIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Command Palette" className="command-palette-backdrop">
      <div className="command-palette-modal">
        <input type="text" placeholder="Buscar comando..." autoFocus aria-label="Command search" />
      </div>
    </div>
  );
};
