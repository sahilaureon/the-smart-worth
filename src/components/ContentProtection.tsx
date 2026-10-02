import React, { useEffect } from 'react';

export const useContentProtection = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Block context menu on media elements and links with images/icons
      if (
        target.tagName === 'IMG' || 
        target.tagName === 'VIDEO' || 
        target.tagName === 'SVG' ||
        target.closest('img') || 
        target.closest('svg') ||
        (target.closest('a') && (target.querySelector('img') || target.querySelector('svg')))
      ) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'IMG' || 
        target.tagName === 'VIDEO' || 
        target.tagName === 'SVG' ||
        target.closest('a')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);
};

export const ContentProtection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useContentProtection();
  return <div className="content-protected">{children}</div>;
};
