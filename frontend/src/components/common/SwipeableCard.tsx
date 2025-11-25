import { ReactNode, useState, useRef, useCallback } from 'react';
import { Card, CardContent, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useSwipe } from '../../hooks/useSwipe';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  swipeLeftAction?: 'delete' | 'edit' | 'custom';
  swipeRightAction?: 'delete' | 'edit' | 'custom';
  showActions?: boolean;
  disabled?: boolean;
}

/**
 * A card component that supports swipe gestures on mobile devices
 * 
 * @example
 * <SwipeableCard
 *   onSwipeLeft={() => handleDelete()}
 *   onSwipeRight={() => handleEdit()}
 *   onDelete={handleDelete}
 *   onEdit={handleEdit}
 * >
 *   <Typography>Card content</Typography>
 * </SwipeableCard>
 */
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onDelete,
  onEdit,
  swipeLeftAction = 'delete',
  swipeRightAction = 'edit',
  showActions = true,
  disabled = false,
}: SwipeableCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const swipeRef = useSwipe({
    onSwipeLeft: () => {
      if (disabled) return;
      if (swipeLeftAction === 'delete' && onDelete) {
        onDelete();
      } else if (swipeLeftAction === 'edit' && onEdit) {
        onEdit();
      } else if (onSwipeLeft) {
        onSwipeLeft();
      }
      setSwipeOffset(0);
    },
    onSwipeRight: () => {
      if (disabled) return;
      if (swipeRightAction === 'delete' && onDelete) {
        onDelete();
      } else if (swipeRightAction === 'edit' && onEdit) {
        onEdit();
      } else if (onSwipeRight) {
        onSwipeRight();
      }
      setSwipeOffset(0);
    },
    threshold: 80,
    velocityThreshold: 0.2,
  });

  // Handle touch move for visual feedback
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || disabled || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    
    // Limit swipe offset to prevent over-swiping
    const maxOffset = 120;
    const newOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    setSwipeOffset(newOffset);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || disabled) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    if (!isMobile || disabled) return;
    // Snap back if not swiped enough
    if (Math.abs(swipeOffset) < 60) {
      setSwipeOffset(0);
    }
    touchStartRef.current = null;
  };

  // Use callback ref to set swipe ref
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    if (node && swipeRef) {
      (swipeRef as { current: HTMLElement | null }).current = node;
    }
  }, [swipeRef]);

  const showLeftAction = swipeOffset < -30 && (swipeLeftAction === 'delete' || swipeLeftAction === 'edit');
  const showRightAction = swipeOffset > 30 && (swipeRightAction === 'delete' || swipeRightAction === 'edit');

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* Action buttons (shown when swiped) */}
      {showActions && isMobile && (
        <>
          {showLeftAction && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: swipeLeftAction === 'delete' ? 'flex-start' : 'flex-end',
                paddingLeft: swipeLeftAction === 'delete' ? 2 : 0,
                paddingRight: swipeLeftAction === 'edit' ? 2 : 0,
                zIndex: 1,
                backgroundColor: swipeLeftAction === 'delete' ? 'error.main' : 'primary.main',
                transition: 'opacity 0.2s',
                opacity: Math.min(1, Math.abs(swipeOffset) / 60),
              }}
            >
              <IconButton
                onClick={() => {
                  if (swipeLeftAction === 'delete' && onDelete) {
                    onDelete();
                  } else if (swipeLeftAction === 'edit' && onEdit) {
                    onEdit();
                  }
                  setSwipeOffset(0);
                }}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
                size="small"
              >
                {swipeLeftAction === 'delete' ? <DeleteIcon /> : <EditIcon />}
              </IconButton>
            </Box>
          )}
          {showRightAction && (
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: swipeRightAction === 'delete' ? 'flex-end' : 'flex-start',
                paddingRight: swipeRightAction === 'delete' ? 2 : 0,
                paddingLeft: swipeRightAction === 'edit' ? 2 : 0,
                zIndex: 1,
                backgroundColor: swipeRightAction === 'delete' ? 'error.main' : 'primary.main',
                transition: 'opacity 0.2s',
                opacity: Math.min(1, Math.abs(swipeOffset) / 60),
              }}
            >
              <IconButton
                onClick={() => {
                  if (swipeRightAction === 'delete' && onDelete) {
                    onDelete();
                  } else if (swipeRightAction === 'edit' && onEdit) {
                    onEdit();
                  }
                  setSwipeOffset(0);
                }}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
                size="small"
              >
                {swipeRightAction === 'delete' ? <DeleteIcon /> : <EditIcon />}
              </IconButton>
            </Box>
          )}
        </>
      )}

      {/* Card content */}
      <Card
        ref={combinedRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          transform: isMobile ? `translateX(${swipeOffset}px)` : 'none',
          transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
          cursor: isMobile ? 'grab' : 'default',
          userSelect: 'none',
          touchAction: 'pan-y',
          '&:active': {
            cursor: isMobile ? 'grabbing' : 'default',
          },
        }}
      >
        <CardContent>{children}</CardContent>
      </Card>
    </Box>
  );
}

