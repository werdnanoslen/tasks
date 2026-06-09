import React, { useRef } from 'react';
import { ReactSortable, ReactSortableProps } from 'react-sortablejs';
import { useMasonry } from '../hooks/useMasonry';

// Wraps ReactSortable to allow native-feeling scroll even when
// Sortable sets touch-action:none on its container.
// Manually implements scroll + momentum via window.scrollBy() during
// the drag delay window, then hands control to Sortable on long-press.
export function ScrollableSortable<T extends { id: string | number }>({
  children,
  onStart,
  onEnd,
  ...props
}: ReactSortableProps<T>) {
  const isDragging = useRef(false);
  const lastY = useRef(0);
  const velocity = useRef(0);
  const rafRef = useRef<number | null>(null);
  const masonryRef = useMasonry();

  function cancelMomentum() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function startMomentum() {
    cancelMomentum();
    function step() {
      if (Math.abs(velocity.current) < 0.5) {
        velocity.current = 0;
        return;
      }
      window.scrollBy(0, velocity.current);
      velocity.current *= 0.92;
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
  }

  return (
    <div
      ref={masonryRef}
      style={{ display: 'contents' }}
      onTouchStart={(e) => {
        cancelMomentum();
        lastY.current = e.touches[0].clientY;
        velocity.current = 0;
      }}
      onTouchMove={(e) => {
        if (isDragging.current) return;
        const currentY = e.touches[0].clientY;
        const delta = lastY.current - currentY;
        velocity.current = delta;
        lastY.current = currentY;
        window.scrollBy(0, delta);
      }}
      onTouchEnd={() => {
        if (!isDragging.current) startMomentum();
      }}
    >
      <ReactSortable
        {...props}
        onStart={(evt, sortable, store) => {
          isDragging.current = true;
          cancelMomentum();
          onStart?.(evt, sortable, store);
        }}
        onEnd={(evt, sortable, store) => {
          isDragging.current = false;
          onEnd?.(evt, sortable, store);
        }}
      >
        {children}
      </ReactSortable>
    </div>
  );
}
