import React, { useState, useRef, useEffect } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';

interface ContextMenuWrapperProps {
  children: React.ReactNode;
  items: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    separator?: boolean;
  }>;
  disabled?: boolean;
}

export const ContextMenuWrapper: React.FC<ContextMenuWrapperProps> = ({
  children,
  items,
  disabled = false,
}) => {
  const [isLongPress, setIsLongPress] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      setShowMenu(true);
      // Note: Cannot call preventDefault here as the event is stale
      // The preventDefault is moved to touch handling if needed
    }, 500); // 500ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!longPressTimer.current) return;
    
    const touch = e.touches[0];
    const distance = Math.sqrt(
      Math.pow(touch.clientX - touchStartPos.current.x, 2) +
      Math.pow(touch.clientY - touchStartPos.current.y, 2)
    );
    
    // Cancel long press if finger moves too much
    if (distance > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
    
    if (isLongPress) {
      setIsLongPress(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={handleContextMenu}
          className="select-none"
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.separator && index > 0 && <ContextMenuSeparator />}
            <ContextMenuItem
              onClick={() => {
                item.onClick();
                setShowMenu(false);
              }}
              className={item.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
            >
              {item.icon && <item.icon className="h-4 w-4 mr-2" />}
              {item.label}
            </ContextMenuItem>
          </React.Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
};