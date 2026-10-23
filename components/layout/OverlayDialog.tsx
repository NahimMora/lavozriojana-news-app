'use client';

import { useEffect, useId, useRef } from 'react';

/** Native modal: focus containment, Escape and focus return without a library. */
export function OverlayDialog({ title, className, onClose, children, returnFocusRef }: {
  title: string;
  className: string;
  onClose: () => void;
  children: React.ReactNode;
  returnFocusRef: React.RefObject<HTMLButtonElement>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const returnFocusTarget = returnFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => returnFocusTarget?.focus({ preventScroll: true }));
    };
  }, [returnFocusRef]);

  return (
    <dialog ref={ref} className={`overlay-dialog ${className}`} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
      }}>
      <div className="overlay-dialog-head">
        <span id={titleId}>{title}</span>
        <button type="button" className="dialog-close" onClick={onClose} aria-label={`Cerrar ${title.toLowerCase()}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
        </button>
      </div>
      {children}
    </dialog>
  );
}
