'use client';

import React, { useRef } from 'react';

interface ModalBackdropProps {
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * Prevents accidental modal dismissal when dragging text selection or sliders
 * from inside the modal out onto the backdrop. Only closes when both
 * mousedown and click originate directly on the backdrop element itself.
 */
export function ModalBackdrop({
  onClose,
  className = '',
  children,
}: ModalBackdropProps) {
  const mouseDownOnBackdropRef = useRef(false);

  return (
    <div
      className={className}
      onMouseDown={(e) => {
        mouseDownOnBackdropRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (mouseDownOnBackdropRef.current && e.target === e.currentTarget) {
          onClose();
        }
        mouseDownOnBackdropRef.current = false;
      }}
    >
      {children}
    </div>
  );
}
