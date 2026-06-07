import React, { useEffect, useRef, useState } from 'react';
import { App } from '@capacitor/app';

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMid = useRef<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{
    x: number;
    y: number;
    tx: number;
    ty: number;
  } | null>(null);

  // Close on Escape (web) or Android back button
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    const backHandler = App.addListener('backButton', () => onClose());
    return () => {
      window.removeEventListener('keydown', handler);
      backHandler.then((h) => h.remove());
    };
  }, [onClose]);

  function getTouchDist(touches: React.TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchMid(touches: React.TouchList) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      lastTouchDist.current = getTouchDist(e.touches);
      lastTouchMid.current = getTouchMid(e.touches);
    } else if (e.touches.length === 1) {
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: translate.x,
        ty: translate.y,
      };
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = getTouchDist(e.touches);
      const ratio = dist / lastTouchDist.current;
      setScale((s) => Math.min(10, Math.max(1, s * ratio)));
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && dragStart.current && scale > 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setTranslate({
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy,
      });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) lastTouchDist.current = null;
    if (e.touches.length === 0) dragStart.current = null;
  }

  function handleDoubleClick() {
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(3);
    }
  }

  return (
    <div
      className="image-viewer-overlay"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      aria-modal="true"
      role="dialog"
      aria-label="Image fullscreen view"
    >
      <img
        src={src}
        alt={alt ?? 'Full screen image'}
        className="image-viewer-img"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={false}
      />
    </div>
  );
}
