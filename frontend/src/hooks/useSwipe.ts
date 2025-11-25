import { useRef, useEffect, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe
  velocityThreshold?: number; // Minimum velocity to trigger swipe
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
}

/**
 * Hook to detect swipe gestures on touch devices
 * 
 * @param handlers - Object containing swipe handlers and configuration
 * @returns Ref to attach to the element that should detect swipes
 * 
 * @example
 * const swipeRef = useSwipe({
 *   onSwipeLeft: () => handleDelete(),
 *   onSwipeRight: () => handleEdit(),
 *   threshold: 50,
 * });
 * 
 * <div ref={swipeRef}>Swipe me!</div>
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
}: SwipeHandlers) {
  const elementRef = useRef<HTMLElement | null>(null) as React.MutableRefObject<HTMLElement | null>;
  const [swipeState, setSwipeState] = useState<SwipeState | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setSwipeState({
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!swipeState) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = touch.clientY - swipeState.startY;
      const deltaTime = Date.now() - swipeState.startTime;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      // Only process if velocity is above threshold (prevents accidental swipes)
      if (velocity < velocityThreshold) {
        setSwipeState(null);
        return;
      }

      // Determine swipe direction based on which axis has more movement
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }

      setSwipeState(null);
    };

    const handleTouchCancel = () => {
      setSwipeState(null);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [swipeState, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold]);

  return elementRef;
}

