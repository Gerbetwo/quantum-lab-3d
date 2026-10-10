import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, title, onClose, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="p-0 backdrop:bg-foreground/70 max-w-lg w-full rounded-2xl outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="bg-[#111a2c] border border-[#29364d] rounded-2xl p-6 text-[#f3f6fc] shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-[#29364d] pb-3">
          <h3 id="dialog-title" className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar diálogo">
            ✕
          </Button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </dialog>
  );
};
