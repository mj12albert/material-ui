'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import composeClasses from '@mui/utils/composeClasses';
import isFocusVisible from '@mui/utils/isFocusVisible';
import CancelIcon from '../internal/svg-icons/Cancel';
import useForkRef from '../utils/useForkRef';
import capitalize from '../utils/capitalize';
import { styled } from '../zero-styled';
import memoTheme from '../utils/memoTheme';
import { useDefaultProps } from '../DefaultPropsProvider';
import chipLinkClasses, { getChipLinkUtilityClass } from './chipLinkClasses';
import useSlot from '../utils/useSlot';
import {
  getChipRootStyles,
  getChipActionStyles,
  getChipLabelStyles,
  getChipDeleteStyles,
  getChipIconStyles,
} from '../Chip/chipSharedStyles';

const useUtilityClasses = (ownerState) => {
  const { classes, size, color, variant, hasDelete, focusVisible } = ownerState;

  const slots = {
    root: [
      'root',
      variant,
      focusVisible && 'focusVisible',
      `size${capitalize(size)}`,
      `color${capitalize(color)}`,
    ],
    action: ['action', focusVisible && 'focusVisible'],
    label: ['label'],
    icon: ['icon'],
    deleteButton: hasDelete && ['deleteButton'],
  };

  return composeClasses(slots, getChipLinkUtilityClass, classes);
};

const ChipLinkRoot = styled('div', {
  name: 'MuiChipLink',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const { ownerState } = props;
    const { color, size, variant } = ownerState;

    return [
      styles.root,
      styles[`size${capitalize(size)}`],
      styles[`color${capitalize(color)}`],
      styles[variant],
    ];
  },
})(
  memoTheme(({ theme }) =>
    getChipRootStyles(theme, {
      focusVisible: chipLinkClasses.focusVisible,
    }),
  ),
);

const ChipLinkAction = styled('a', {
  name: 'MuiChipLink',
  slot: 'Action',
  overridesResolver: (props, styles) => styles.action,
})(memoTheme(({ theme }) => getChipActionStyles(theme, chipLinkClasses.focusVisible)));

const ChipLinkLabel = styled('span', {
  name: 'MuiChipLink',
  slot: 'Label',
  overridesResolver: (props, styles) => styles.label,
})(getChipLabelStyles());

const ChipLinkDeleteButton = styled('button', {
  name: 'MuiChipLink',
  slot: 'DeleteButton',
  overridesResolver: (props, styles) => styles.deleteButton,
})(memoTheme(({ theme }) => getChipDeleteStyles(theme)));

const ChipLinkIcon = styled('span', {
  name: 'MuiChipLink',
  slot: 'Icon',
  overridesResolver: (props, styles) => styles.icon,
})(memoTheme(({ theme }) => getChipIconStyles(theme)));

function isDeleteKeyboardEvent(event) {
  return event.key === 'Backspace' || event.key === 'Delete';
}

/**
 * A chip component with link semantics.
 *
 * - Without `onDelete`: root IS an `<a>` (1 tab stop)
 * - With `onDelete`: root is a `<div>` with an action `<a>` overlay + delete `<button>` (2 tab stops)
 *
 * ChipLink cannot be disabled. Disabled links are a bad pattern — there is no
 * native disabled state for `<a>` elements. If a link destination is unavailable,
 * remove the ChipLink from the DOM or replace it with a disabled ChipButton.
 */
const ChipLink = React.forwardRef(function ChipLink(inProps, ref) {
  const props = useDefaultProps({ props: inProps, name: 'MuiChipLink' });
  const {
    avatar: avatarProp,
    className,
    color = 'default',
    deleteIcon: deleteIconProp,
    deleteLabel = 'Remove',
    href,
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

  const chipRef = React.useRef(null);
  const handleRef = useForkRef(chipRef, ref);

  const labelId = React.useId();
  const hasDelete = Boolean(onDelete);
  const iconElement = avatarProp || iconProp;

  // Focus-visible tracking
  const [focusVisibleState, setFocusVisibleState] = React.useState(false);

  const handleFocus = (event) => {
    if (isFocusVisible(event.target)) {
      setFocusVisibleState(true);
    }
    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event) => {
    if (focusVisibleState) {
      setFocusVisibleState(false);
    }
    if (onBlur) {
      onBlur(event);
    }
  };

  const ownerState = {
    ...props,
    color,
    variant,
    size,
    disabled: false,
    hasDelete,
    interactive: !hasDelete,
    focusVisible: focusVisibleState,
    iconColor: React.isValidElement(iconProp) ? iconProp.props.color || color : color,
  };

  const classes = useUtilityClasses(ownerState);

  if (process.env.NODE_ENV !== 'production') {
    if (avatarProp && iconProp) {
      console.error(
        'MUI: The ChipLink component can not handle the avatar ' +
          'and the icon prop at the same time. Pick one.',
      );
    }
  }

  const externalForwardedProps = { slots, slotProps };

  // -- Slot: Root --
  // Top-level rest props always land on root for consistent behavior in both modes.
  // Use slotProps.action / slotProps.deleteButton for sub-control customization.
  const [RootSlot, rootProps] = useSlot('root', {
    elementType: ChipLinkRoot,
    externalForwardedProps: {
      ...externalForwardedProps,
      ...other,
    },
    ownerState,
    ref: handleRef,
    className: clsx(classes.root, className),
    additionalProps: {
      ...(!hasDelete && { href }),
    },
    getSlotProps: (handlers) => ({
      ...handlers,
      ...(!hasDelete && {
        onClick: (event) => {
          handlers.onClick?.(event);
          onClick?.(event);
        },
        onFocus: (event) => {
          handlers.onFocus?.(event);
          handleFocus(event);
        },
        onBlur: (event) => {
          handlers.onBlur?.(event);
          handleBlur(event);
        },
        onKeyDown: (event) => {
          handlers.onKeyDown?.(event);
          onKeyDown?.(event);
          if (onDelete && isDeleteKeyboardEvent(event)) {
            event.preventDefault();
          }
        },
        onKeyUp: (event) => {
          handlers.onKeyUp?.(event);
          onKeyUp?.(event);
          if (onDelete && isDeleteKeyboardEvent(event)) {
            onDelete(event);
          }
        },
      }),
    }),
  });

  // -- Slot: Action (only in overlay mode) --
  // Receives only explicit interactive props. Element-specific attributes
  // (e.g. target, rel, download) should be set via slotProps.action.
  const [ActionSlot, actionSlotProps] = useSlot('action', {
    elementType: ChipLinkAction,
    externalForwardedProps,
    ownerState,
    className: classes.action,
    additionalProps: {
      href,
      'aria-labelledby': labelId,
    },
    getSlotProps: (handlers) => ({
      ...handlers,
      onClick: (event) => {
        handlers.onClick?.(event);
        onClick?.(event);
      },
      onFocus: (event) => {
        handlers.onFocus?.(event);
        handleFocus(event);
      },
      onBlur: (event) => {
        handlers.onBlur?.(event);
        handleBlur(event);
      },
      onKeyDown: (event) => {
        handlers.onKeyDown?.(event);
        onKeyDown?.(event);
        if (isDeleteKeyboardEvent(event)) {
          event.preventDefault();
        }
      },
      onKeyUp: (event) => {
        handlers.onKeyUp?.(event);
        onKeyUp?.(event);
        if (isDeleteKeyboardEvent(event)) {
          onDelete(event);
        }
      },
    }),
  });

  // -- Slot: Label --
  const [LabelSlot, labelSlotProps] = useSlot('label', {
    elementType: ChipLinkLabel,
    externalForwardedProps,
    ownerState,
    className: classes.label,
    additionalProps: {
      ...(hasDelete && { id: labelId, style: { pointerEvents: 'none' } }),
    },
  });

  // -- Slot: DeleteButton --
  const [DeleteButtonSlot, deleteButtonSlotProps] = useSlot('deleteButton', {
    elementType: ChipLinkDeleteButton,
    externalForwardedProps,
    ownerState,
    className: classes.deleteButton,
    additionalProps: {
      'aria-label': deleteLabel,
      type: 'button',
    },
    getSlotProps: (handlers) => ({
      ...handlers,
      onClick: (event) => {
        handlers.onClick?.(event);
        event.stopPropagation();
        onDelete?.(event);
      },
    }),
  });

  // -- Slot: Icon --
  const [IconSlot, iconSlotProps] = useSlot('icon', {
    elementType: ChipLinkIcon,
    externalForwardedProps,
    ownerState,
    className: classes.icon,
    additionalProps: { 'aria-hidden': true },
  });

  const iconNode = iconElement ? <IconSlot {...iconSlotProps}>{iconElement}</IconSlot> : null;

  const deleteNode = onDelete ? (
    <DeleteButtonSlot {...deleteButtonSlotProps}>
      {deleteIconProp || <CancelIcon fontSize="inherit" />}
    </DeleteButtonSlot>
  ) : null;

  // -- Mode 1: Without onDelete — root IS the <a> --
  if (!hasDelete) {
    return (
      <RootSlot as="a" {...rootProps}>
        {iconNode}
        <LabelSlot {...labelSlotProps}>{label}</LabelSlot>
      </RootSlot>
    );
  }

  // -- Mode 2: With onDelete — overlay pattern --
  return (
    <RootSlot {...rootProps}>
      <ActionSlot {...actionSlotProps} />
      {iconNode}
      <LabelSlot {...labelSlotProps}>{label}</LabelSlot>
      {deleteNode}
    </RootSlot>
  );
});

ChipLink.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.    │
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
   * The URL to link to.
   */
  href: PropTypes.string.isRequired,
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
   * The variant to use.
   * @default 'filled'
   */
  variant: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.oneOf(['filled', 'outlined']),
    PropTypes.string,
  ]),
};

export default ChipLink;
