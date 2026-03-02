'use client';
import * as React from 'react';
import isFocusVisible from '@mui/utils/isFocusVisible';
import useLazyRipple from '../useLazyRipple';

interface UseChipInteractionOptions {
  disabled?: (boolean) | undefined;
  focusableWhenDisabled?: (boolean) | undefined;
  onFocus?: (React.FocusEventHandler<HTMLElement>) | undefined;
  onBlur?: (React.FocusEventHandler<HTMLElement>) | undefined;
}

export default function useChipInteraction(options: UseChipInteractionOptions) {
  const { disabled = false, focusableWhenDisabled = false, onFocus, onBlur } = options;

  // Focus-visible tracking
  const [focusVisibleState, setFocusVisibleState] = React.useState(false);
  // Only clear focus-visible when the element becomes truly unfocusable.
  // When focusableWhenDisabled is true, the chip is still keyboard-reachable
  // and must show focus-visible so users can see where focus is.
  if (disabled && !focusableWhenDisabled && focusVisibleState) {
    setFocusVisibleState(false);
  }

  // Ripple
  const ripple = useLazyRipple();
  const enableTouchRipple = ripple.shouldMount && !disabled;

  const handleFocus = (event: React.FocusEvent<HTMLElement>) => {
    if (isFocusVisible(event.target)) {
      setFocusVisibleState(true);
    }
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (ripple.shouldMount) {
      ripple.stop(event);
    }
    if (focusVisibleState) {
      setFocusVisibleState(false);
    }
    onBlur?.(event);
  };

  const getRippleHandlers = (
    handlers: Record<string, React.EventHandler<React.SyntheticEvent>>,
  ) => {
    if (disabled) {
      return {};
    }
    return {
      onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
        handlers.onMouseDown?.(event);
        ripple.start(event);
      },
      onMouseUp: (event: React.MouseEvent<HTMLElement>) => {
        handlers.onMouseUp?.(event);
        ripple.stop(event);
      },
      onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
        handlers.onMouseLeave?.(event);
        ripple.stop(event);
      },
      onDragLeave: (event: React.DragEvent<HTMLElement>) => {
        handlers.onDragLeave?.(event);
        ripple.stop(event);
      },
      onTouchStart: (event: React.TouchEvent<HTMLElement>) => {
        handlers.onTouchStart?.(event);
        ripple.start(event);
      },
      onTouchEnd: (event: React.TouchEvent<HTMLElement>) => {
        handlers.onTouchEnd?.(event);
        ripple.stop(event);
      },
      onTouchMove: (event: React.TouchEvent<HTMLElement>) => {
        handlers.onTouchMove?.(event);
        ripple.stop(event);
      },
      onContextMenu: (event: React.MouseEvent<HTMLElement>) => {
        handlers.onContextMenu?.(event);
        ripple.stop(event);
      },
    };
  };

  return {
    focusVisibleState,
    handleFocus,
    handleBlur,
    getRippleHandlers,
    enableTouchRipple,
    touchRippleRef: ripple.ref,
  };
}
