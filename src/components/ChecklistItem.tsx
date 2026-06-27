import React, { useEffect, useRef } from 'react';
import { ListItem } from '../tasks/task.model';

interface ChecklistItemProps {
  children: React.ReactNode;
  item: ListItem;
  deleteListItem: (id: string) => void;
  toggleListItemDone: (id: string) => void;
  indentListItem: (id: string, direction: 1 | -1) => void;
}

const ChecklistItem = React.memo(function ChecklistItem({
  children,
  item,
  deleteListItem,
  toggleListItemDone,
  indentListItem,
}: ChecklistItemProps) {
  const indent = item.indent || 0;
  const swipeState = useRef<{ startX: number; startY: number } | null>(null);
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleRef = useRef<HTMLSpanElement>(null);
  const indentRef = useRef(indentListItem);
  const itemIdRef = useRef(item.id);
  useEffect(() => {
    indentRef.current = indentListItem;
  }, [indentListItem]);
  useEffect(() => {
    itemIdRef.current = item.id;
  }, [item.id]);

  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      swipeState.current = { startX: t.clientX, startY: t.clientY };
      console.log('[indent] touchstart', { x: t.clientX, y: t.clientY });
    }
    function onTouchMove(e: TouchEvent) {
      if (!swipeState.current) return;
      const t = e.touches[0];
      const dx = t.clientX - swipeState.current.startX;
      const dy = t.clientY - swipeState.current.startY;
      console.log('[indent] touchmove', { dx, dy });
      if (Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy)) {
        console.log(
          '[indent] horizontal detected, indenting',
          dx > 0 ? '+1' : '-1'
        );
        e.stopPropagation();
        e.preventDefault();
        swipeState.current = null;
        indentRef.current(itemIdRef.current, dx > 0 ? 1 : -1);
      }
    }
    function onTouchEnd() {
      console.log('[indent] touchend');
      swipeState.current = null;
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLSpanElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLSpanElement>) {
    if (!mouseStartRef.current) return;
    const dx = e.clientX - mouseStartRef.current.x;
    const dy = e.clientY - mouseStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 8) return;
    mouseStartRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (Math.abs(dx) > Math.abs(dy) * 2) {
      // Strongly horizontal: cancel SortableJS drag and indent
      document.dispatchEvent(
        new MouseEvent('mouseup', { bubbles: true, cancelable: true })
      );
      indentRef.current(itemIdRef.current, dx > 0 ? 1 : -1);
    }
    // Vertical: just release capture — SortableJS handles the drag via mouse events
  }

  function handlePointerUp(e: React.PointerEvent<HTMLSpanElement>) {
    mouseStartRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <li key={item.id} style={{ paddingLeft: `${indent * 1.5}rem` }}>
      <div className="list-controls">
        <span
          ref={handleRef}
          className="btn btn__icon btn__drag"
          aria-label="Move list item"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <span className="visually-hidden">Move list item</span>
          <span className="ascii-icon" aria-hidden="true">
            {String.fromCharCode(0x205e) + String.fromCharCode(0x205e)}
          </span>
        </span>
        <input
          type="checkbox"
          checked={item.done}
          aria-label="done"
          onChange={() => toggleListItemDone(item.id)}
        />
      </div>
      {children}
      <button
        type="button"
        className="btn btn__icon btn__close"
        onClick={() => deleteListItem(item.id)}
      >
        <span className="ascii-icon" aria-hidden="true">
          {String.fromCharCode(10005)}
        </span>
        <span className="visually-hidden">Delete list item</span>
      </button>
    </li>
  );
});
export default ChecklistItem;
