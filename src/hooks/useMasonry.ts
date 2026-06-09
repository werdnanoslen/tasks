import { useEffect, useRef } from 'react';

const ROW_HEIGHT = 1; // px, matches grid-auto-rows in CSS
const GAP = 16; // px, 1rem gap between columns

export function useMasonry() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // The outer div has display:contents; the actual grid is its first child (the ul)
    const grid = containerRef.current?.children[0] as HTMLElement | undefined;
    if (!grid) return;

    function layout() {
      if (!grid) return;
      const items = Array.from(grid.children) as HTMLElement[];
      items.forEach((item) => {
        item.style.gridRowEnd = '';
        const height = item.getBoundingClientRect().height;
        // With grid-auto-rows: 1px and row-gap: 0, span N = N pixels.
        // We include the desired gap so the next item starts GAP px below.
        const span = Math.ceil(height + GAP);
        item.style.gridRowEnd = `span ${span}`;
        item.style.alignSelf = 'start';
      });
    }

    const ro = new ResizeObserver(layout);
    ro.observe(grid);
    Array.from(grid.children).forEach((child) => ro.observe(child));

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node instanceof Element) ro.observe(node);
        });
        m.removedNodes.forEach((node) => {
          if (node instanceof Element) ro.unobserve(node);
        });
      });
      layout();
    });
    mo.observe(grid, { childList: true });

    layout();

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return containerRef;
}
