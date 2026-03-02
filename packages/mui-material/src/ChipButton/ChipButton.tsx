'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import composeClasses from '@mui/utils/composeClasses';
import CancelIcon from '../internal/svg-icons/Cancel';
import useForkRef from '../utils/useForkRef';
import capitalize from '../utils/capitalize';
import { styled } from '../zero-styled';
import memoTheme from '../utils/memoTheme';
import { useDefaultProps } from '../DefaultPropsProvider';
import chipButtonClasses, { getChipButtonUtilityClass } from './chipButtonClasses';
import useSlot from '../utils/useSlot';
import useFocusableWhenDisabled from '../utils/useFocusableWhenDisabled';
import { TouchRippleComponent, isDeleteKeyboardEvent } from '../Chip/utils';
import useChipInteraction from '../Chip/useChipInteraction';
import type { ChipButtonOwnerState, ChipButtonProps } from './ChipButton.types';
import {
  getChipRootStyles,
  getChipActionStyles,
  getChipLabelStyles,
  getChipDeleteStyles,
  getChipIconStyles,
} from '../Chip/chipSharedStyles';

export type {
  ChipButtonSlots,
  ChipButtonSlotsAndSlotProps,
  ChipButtonPropsVariantOverrides,
  ChipButtonPropsSizeOverrides,
  ChipButtonPropsColorOverrides,
  ChipButtonOwnProps,
  ChipButtonProps,
} from './ChipButton.types';

// ---- Utility classes ----

const useUtilityClasses = (ownerState: ChipButtonOwnerState) => {
  const { classes, disabled, size, color, variant, focusVisible } = ownerState;

  const slots = {
    root: [
      'root',
      variant,
      disabled && 'disabled',
      focusVisible && 'focusVisible',
      `size${capitalize(size!)}`,
      `color${capitalize(color!)}`,
    ],
    action: ['action', focusVisible && 'focusVisible'],
    label: ['label'],
    icon: ['icon'],
    deleteButton: ['deleteButton'],
  };

  return composeClasses(slots, getChipButtonUtilityClass, classes);
};

// ---- Styled components ----

const ChipButtonRoot = styled('div', {
  name: 'MuiChipButton',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const { ownerState } = props;
    const { color, size, variant, disabled } = ownerState;

    return [
      styles.root,
      styles[`size${capitalize(size)}`],
      styles[`color${capitalize(color)}`],
      styles[variant],
      disabled && styles.disabled,
    ];
  },
})(
  memoTheme(({ theme }) =>
    getChipRootStyles(theme, {
      focusVisible: chipButtonClasses.focusVisible,
      disabled: chipButtonClasses.disabled,
    }),
  ),
);

const ChipButtonAction = styled('button', {
  name: 'MuiChipButton',
  slot: 'Action',
  overridesResolver: (props, styles) => styles.action,
})(memoTheme(({ theme }) => getChipActionStyles(theme, chipButtonClasses.focusVisible)));

const ChipButtonLabel = styled('span', {
  name: 'MuiChipButton',
  slot: 'Label',
  overridesResolver: (props, styles) => styles.label,
})(getChipLabelStyles());

const ChipButtonDeleteButton = styled('button', {
  name: 'MuiChipButton',
  slot: 'DeleteButton',
  overridesResolver: (props, styles) => styles.deleteButton,
})(memoTheme(({ theme }) => getChipDeleteStyles(theme)));

const ChipButtonIcon = styled('span', {
  name: 'MuiChipButton',
  slot: 'Icon',
  overridesResolver: (props, styles) => styles.icon,
})(memoTheme(({ theme }) => getChipIconStyles(theme)));

// ---- Component ----

/**
 * A chip component with button semantics.
 *
 * - Without `onDelete`: root IS a `<button>` (1 tab stop)
 * - With `onDelete`: root is a `<div>` with an action `<button>` overlay + delete `<button>` (2 tab stops)
 *
 * Demos:
 *
 * - [Chip](https://next.mui.com/material-ui/react-chip/)
 *
 * API:
 *
 * - [ChipButton API](https://next.mui.com/material-ui/api/chip-button/)
 */
const ChipButton = React.forwardRef<HTMLDivElement, ChipButtonProps>(
  function ChipButton(inProps, ref) {
    const props = useDefaultProps({ props: inProps, name: 'MuiChipButton' });
    const {
      avatar: avatarProp,
      className,
      color = 'default',
      deleteIcon: deleteIconProp,
      deleteLabel = 'Remove',
      disabled = false,
      focusableWhenDisabled = true,
      icon: iconProp,
      label,
      onClick,
      onDelete,
      onFocus,
      onBlur,
      onKeyDown,
      onKeyUp,
      size = 'medium',
      variant = 'filled',
      slots = {},
      slotProps = {},
      ...other
    } = props;

    // Runtime guard: strip `type` from rest props so it never leaks to root.
    // TypeScript already prevents `type` via Omit, but JS callers or theme defaultProps could pass it.
    const { type: topLevelType, ...otherWithoutType } = other as typeof other & {
      type?: string | undefined;
    };

    const chipRef = React.useRef<HTMLDivElement>(null);
    const handleRef = useForkRef(chipRef, ref);

    const labelId = React.useId();
    const hasDelete = Boolean(onDelete);
    const iconElement = avatarProp || iconProp;

    const {
      focusVisibleState,
      handleFocus,
      handleBlur,
      getRippleHandlers,
      enableTouchRipple,
      touchRippleRef,
    } = useChipInteraction({ disabled, focusableWhenDisabled, onFocus, onBlur });

    // Focusable-when-disabled for the primary interactive element
    const { props: focusableProps } = useFocusableWhenDisabled({
      focusableWhenDisabled,
      disabled,
      isNativeButton: true,
      tabIndex: otherWithoutType.tabIndex ?? 0,
    });
    const { onKeyDown: focusableOnKeyDown, ...focusableRestProps } = focusableProps;

    // Focusable-when-disabled for the delete button
    const { props: deleteFocusableProps } = useFocusableWhenDisabled({
      focusableWhenDisabled,
      disabled,
      isNativeButton: true,
    });
    const { onKeyDown: deleteFocusableOnKeyDown, ...deleteFocusableRestProps } =
      deleteFocusableProps;

    const ownerState: ChipButtonOwnerState = {
      ...props,
      color,
      variant,
      size,
      disabled,
      hasDelete,
      interactive: !hasDelete,
      focusVisible: focusVisibleState,
      iconColor: React.isValidElement(iconProp)
        ? ((iconProp.props as Record<string, unknown>).color as string) || color
        : color,
    };

    const classes = useUtilityClasses(ownerState);

    if (process.env.NODE_ENV !== 'production') {
      if (avatarProp && iconProp) {
        console.error(
          'MUI: The ChipButton component can not handle the avatar ' +
            'and the icon prop at the same time. Pick one.',
        );
      }
    }

    const externalForwardedProps = { slots, slotProps };

    // Strip `type` from slotProps.root — the root element's type is controlled
    // internally (type="button" in non-delete mode, no type on div in delete mode).
    const { type: rootSlotType, ...rootSlotPropsWithoutType } =
      ((typeof slotProps.root === 'function' ? slotProps.root(ownerState) : slotProps.root) as
        | Record<string, unknown>
        | undefined) || {};
    const rootExternalForwardedProps = {
      slots,
      slotProps: { ...slotProps, root: rootSlotPropsWithoutType },
    };

    // -- Slot: Root --
    // Top-level rest props always land on root for consistent behavior in both modes.
    // Use slotProps.action / slotProps.deleteButton for sub-control customization.
    const [RootSlot, rootProps] = useSlot('root', {
      elementType: ChipButtonRoot,
      externalForwardedProps: {
        ...rootExternalForwardedProps,
        ...otherWithoutType,
      },
      ownerState,
      ref: handleRef,
      className: clsx(classes.root, className),
      additionalProps: {
        ...(!hasDelete && focusableRestProps),
      },
      getSlotProps: (handlers: Record<string, React.EventHandler<React.SyntheticEvent>>) => ({
        ...handlers,
        ...(!hasDelete && {
          ...getRippleHandlers(handlers),
          onClick: (event: React.MouseEvent<HTMLElement>) => {
            handlers.onClick?.(event);
            onClick?.(event);
          },
          onFocus: (event: React.FocusEvent<HTMLElement>) => {
            handlers.onFocus?.(event);
            handleFocus(event);
          },
          onBlur: (event: React.FocusEvent<HTMLElement>) => {
            handlers.onBlur?.(event);
            handleBlur(event);
          },
          onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
            handlers.onKeyDown?.(event);
            focusableOnKeyDown?.(event);
            onKeyDown?.(event);
            if (!disabled && onDelete && isDeleteKeyboardEvent(event)) {
              event.preventDefault();
            }
          },
          onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => {
            handlers.onKeyUp?.(event);
            onKeyUp?.(event);
            if (!disabled && onDelete && isDeleteKeyboardEvent(event)) {
              onDelete(event);
            }
          },
        }),
      }),
    });

    // -- Slot: Action (only in overlay mode) --
    // Receives only explicit interactive props. Element-specific attributes
    // (e.g. name, value, formAction) should be set via slotProps.action.
    const [ActionSlot, actionSlotProps] = useSlot('action', {
      elementType: ChipButtonAction,
      externalForwardedProps,
      ownerState,
      className: classes.action,
      additionalProps: {
        ...focusableRestProps,
        'aria-labelledby': labelId,
        type: 'button' as const,
      },
      getSlotProps: (handlers: Record<string, React.EventHandler<React.SyntheticEvent>>) => ({
        ...handlers,
        ...getRippleHandlers(handlers),
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          handlers.onClick?.(event);
          onClick?.(event);
        },
        onFocus: (event: React.FocusEvent<HTMLElement>) => {
          handlers.onFocus?.(event);
          handleFocus(event);
        },
        onBlur: (event: React.FocusEvent<HTMLElement>) => {
          handlers.onBlur?.(event);
          handleBlur(event);
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          handlers.onKeyDown?.(event);
          focusableOnKeyDown?.(event);
          onKeyDown?.(event);
          if (!disabled && isDeleteKeyboardEvent(event)) {
            event.preventDefault();
          }
        },
        onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => {
          handlers.onKeyUp?.(event);
          onKeyUp?.(event);
          if (!disabled && isDeleteKeyboardEvent(event)) {
            onDelete!(event);
          }
        },
      }),
    });

    // -- Slot: Label --
    const [LabelSlot, labelSlotProps] = useSlot('label', {
      elementType: ChipButtonLabel,
      externalForwardedProps,
      ownerState,
      className: classes.label,
      additionalProps: {
        ...(hasDelete && { id: labelId, style: { pointerEvents: 'none' as const } }),
      },
    });

    // -- Slot: DeleteButton --
    const [DeleteButtonSlot, deleteButtonSlotProps] = useSlot('deleteButton', {
      elementType: ChipButtonDeleteButton,
      externalForwardedProps,
      ownerState,
      className: classes.deleteButton,
      additionalProps: {
        ...deleteFocusableRestProps,
        'aria-label': deleteLabel,
        type: 'button' as const,
      },
      getSlotProps: (handlers: Record<string, React.EventHandler<React.SyntheticEvent>>) => ({
        ...handlers,
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          handlers.onClick?.(event);
          event.stopPropagation();
          if (!disabled) {
            onDelete?.(event);
          }
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          handlers.onKeyDown?.(event);
          deleteFocusableOnKeyDown?.(event);
        },
      }),
    });

    // -- Slot: Icon --
    const [IconSlot, iconSlotProps] = useSlot('icon', {
      elementType: ChipButtonIcon,
      externalForwardedProps,
      ownerState,
      className: classes.icon,
      additionalProps: { 'aria-hidden': true as const },
    });

    const iconNode = iconElement ? <IconSlot {...iconSlotProps}>{iconElement}</IconSlot> : null;

    const deleteNode = onDelete ? (
      <DeleteButtonSlot {...deleteButtonSlotProps}>
        {deleteIconProp || <CancelIcon fontSize="inherit" />}
      </DeleteButtonSlot>
    ) : null;

    const touchRippleNode = enableTouchRipple ? (
      <TouchRippleComponent ref={touchRippleRef} />
    ) : null;

    // -- Mode 1: Without onDelete — root IS the <button> --
    // type="button" is placed after the spread so it can never be overridden
    // by slotProps.root or other external sources.
    if (!hasDelete) {
      return (
        <RootSlot
          as="button"
          {...rootProps}
          {
            ...({
              type: 'button',
            } as any) /* polymorphic: styled('div') rendered as <button> via `as` prop */
          }
        >
          {iconNode}
          <LabelSlot {...labelSlotProps}>{label}</LabelSlot>
          {touchRippleNode}
        </RootSlot>
      );
    }

    // -- Mode 2: With onDelete — overlay pattern --
    return (
      <RootSlot {...rootProps}>
        <ActionSlot {...actionSlotProps}>{touchRippleNode}</ActionSlot>
        {iconNode}
        <LabelSlot {...labelSlotProps}>{label}</LabelSlot>
        {deleteNode}
      </RootSlot>
    );
  },
);

ChipButton.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The Avatar element to display.
   */
  avatar: PropTypes.element,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'default'
   */
  color: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.oneOf(['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning']),
    PropTypes.string,
  ]),
  /**
   * Override the default delete icon element. Shown only if `onDelete` is set.
   */
  deleteIcon: PropTypes.element,
  /**
   * The accessible label for the delete button.
   * @default 'Remove'
   */
  deleteLabel: PropTypes.string,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, the disabled chip can receive focus.
   * @default true
   */
  focusableWhenDisabled: PropTypes.bool,
  /**
   * Icon element.
   */
  icon: PropTypes.element,
  /**
   * The content of the component.
   */
  label: PropTypes.node,
  /**
   * @ignore
   */
  onBlur: PropTypes.func,
  /**
   * @ignore
   */
  onClick: PropTypes.func,
  /**
   * Callback fired when the delete icon is clicked.
   * If set, the delete icon will be shown.
   */
  onDelete: PropTypes.func,
  /**
   * @ignore
   */
  onFocus: PropTypes.func,
  /**
   * @ignore
   */
  onKeyDown: PropTypes.func,
  /**
   * @ignore
   */
  onKeyUp: PropTypes.func,
  /**
   * The size of the component.
   * @default 'medium'
   */
  size: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.oneOf(['medium', 'small']),
    PropTypes.string,
  ]),
  /**
   * The props used for each slot inside.
   * @default {}
   */
  slotProps: PropTypes.shape({
    action: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    deleteButton: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    label: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    root: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  }),
  /**
   * The components used for each slot inside.
   * @default {}
   */
  slots: PropTypes.shape({
    action: PropTypes.elementType,
    deleteButton: PropTypes.elementType,
    icon: PropTypes.elementType,
    label: PropTypes.elementType,
    root: PropTypes.elementType,
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])),
    PropTypes.func,
    PropTypes.object,
  ]),
  /**
   * @ignore
   */
  tabIndex: PropTypes.number,
  /**
   * The variant to use.
   * @default 'filled'
   */
  variant: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.oneOf(['filled', 'outlined']),
    PropTypes.string,
  ]),
} as any;

export default ChipButton;
