'use client';
import * as React from 'react';
import { isDeleteKeyboardEvent } from './utils';

type EventHandlers = Record<string, React.EventHandler<React.SyntheticEvent>>;

interface UseChipActionHandlersOptions {
  disabled?: boolean | undefined;
  onClick?: React.MouseEventHandler<HTMLElement> | undefined;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement> | undefined;
  onKeyUp?: React.KeyboardEventHandler<HTMLElement> | undefined;
  onDelete?: React.EventHandler<React.SyntheticEvent> | undefined;
  onFocus: React.FocusEventHandler<HTMLElement>;
  onBlur: React.FocusEventHandler<HTMLElement>;
  interactiveOnKeyDown?: React.KeyboardEventHandler<HTMLElement> | undefined;
  deleteButtonOnKeyDown?: React.KeyboardEventHandler<HTMLElement> | undefined;
  getRippleHandlers: (handlers: EventHandlers) => Partial<EventHandlers>;
}

interface InteractiveSlotOptions {
  handleDeleteKey?: boolean | undefined;
}

interface DeleteButtonSlotOptions {
  preventClickWhenDisabled?: boolean | undefined;
  includeFocusableOnKeyDown?: boolean | undefined;
}

export default function useChipActionHandlers(options: UseChipActionHandlersOptions) {
  const {
    disabled = false,
    onClick,
    onKeyDown,
    onKeyUp,
    onDelete,
    onFocus,
    onBlur,
    interactiveOnKeyDown,
    deleteButtonOnKeyDown,
    getRippleHandlers,
  } = options;

  const getInteractiveSlotHandlers = React.useCallback(
    (handlers: EventHandlers, slotOptions: InteractiveSlotOptions = {}) => {
      const { handleDeleteKey = false } = slotOptions;

      return {
        ...handlers,
        ...getRippleHandlers(handlers),
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          handlers.onClick?.(event);
          onClick?.(event);
        },
        onFocus: (event: React.FocusEvent<HTMLElement>) => {
          handlers.onFocus?.(event);
          onFocus(event);
        },
        onBlur: (event: React.FocusEvent<HTMLElement>) => {
          handlers.onBlur?.(event);
          onBlur(event);
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          handlers.onKeyDown?.(event);
          interactiveOnKeyDown?.(event);
          onKeyDown?.(event);
          if (!disabled && handleDeleteKey && isDeleteKeyboardEvent(event)) {
            event.preventDefault();
          }
        },
        onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => {
          handlers.onKeyUp?.(event);
          onKeyUp?.(event);
          if (!disabled && handleDeleteKey && isDeleteKeyboardEvent(event)) {
            onDelete?.(event);
          }
        },
      };
    },
    [
      disabled,
      getRippleHandlers,
      interactiveOnKeyDown,
      onBlur,
      onClick,
      onDelete,
      onFocus,
      onKeyDown,
      onKeyUp,
    ],
  );

  const getDeleteButtonSlotHandlers = React.useCallback(
    (handlers: EventHandlers, slotOptions: DeleteButtonSlotOptions = {}) => {
      const { preventClickWhenDisabled = false, includeFocusableOnKeyDown = false } = slotOptions;

      return {
        ...handlers,
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          handlers.onClick?.(event);
          event.stopPropagation();
          if (!preventClickWhenDisabled || !disabled) {
            onDelete?.(event);
          }
        },
        ...(includeFocusableOnKeyDown && {
          onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
            handlers.onKeyDown?.(event);
            deleteButtonOnKeyDown?.(event);
          },
        }),
      };
    },
    [deleteButtonOnKeyDown, disabled, onDelete],
  );

  return {
    getInteractiveSlotHandlers,
    getDeleteButtonSlotHandlers,
  };
}
