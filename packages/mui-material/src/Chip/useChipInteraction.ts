'use client';
import * as React from 'react';
import useLazyRipple from '../useLazyRipple';

export interface RippleExternalHandlers {
  onMouseDown?: React.MouseEventHandler<HTMLElement> | undefined;
  onMouseUp?: React.MouseEventHandler<HTMLElement> | undefined;
  onMouseLeave?: React.MouseEventHandler<HTMLElement> | undefined;
  onDragLeave?: React.DragEventHandler<HTMLElement> | undefined;
  onTouchStart?: React.TouchEventHandler<HTMLElement> | undefined;
  onTouchEnd?: React.TouchEventHandler<HTMLElement> | undefined;
  onTouchMove?: React.TouchEventHandler<HTMLElement> | undefined;
  onContextMenu?: React.MouseEventHandler<HTMLElement> | undefined;
}

interface UseChipInteractionOptions {
  disabled?: boolean | undefined;
  onFocus?: React.FocusEventHandler<HTMLElement> | undefined;
  onBlur?: React.FocusEventHandler<HTMLElement> | undefined;
}

export default function useChipInteraction(options: UseChipInteractionOptions) {
  const { disabled = false, onFocus, onBlur } = options;

  const ripple = useLazyRipple();
  const enableTouchRipple = ripple.shouldMount && !disabled;

  const handleFocus = (event: React.FocusEvent<HTMLElement>) => {
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (ripple.shouldMount) {
      ripple.stop(event);
    }
    onBlur?.(event);
  };

  const getRippleHandlers = (handlers: RippleExternalHandlers) => {
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
    handleFocus,
    handleBlur,
    getRippleHandlers,
    enableTouchRipple,
    touchRippleRef: ripple.ref,
  };
}
