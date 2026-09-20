import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * PortalModal — renders its children in a full-viewport overlay portaled to
 * <body>, so it blurs the ENTIRE screen (sidebar included), blocks clicks to
 * everything behind it, and locks background scroll while open.
 *
 * The backdrop is intentionally NOT click-to-close — the modal closes only via
 * its own Cancel / X controls.
 *
 * Props:
 *  - maxWidth : max width of the card (default 440)
 *  - children : modal body (should include its own .modal-content or content)
 */
export default function PortalModal({ maxWidth = 440, children }) {
  // Lock background scroll while the modal is open; restore on close.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div
      className="modal-overlay modal-portal-overlay open"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        style={{ maxWidth: `${maxWidth}px` }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
