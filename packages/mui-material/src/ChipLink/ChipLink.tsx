'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import composeClasses from '@mui/utils/composeClasses';
import { styled } from '../zero-styled';
import memoTheme from '../utils/memoTheme';
import { useDefaultProps } from '../DefaultPropsProvider';
import { getChipLinkUtilityClass } from './chipLinkClasses';
import { TouchRippleComponent } from '../Chip/utils';
import useChipInteraction from '../Chip/useChipInteraction';
import ChipContext from '../Chip/ChipContext';
import type { ChipLinkOwnerState, ChipLinkProps } from './ChipLink.types';
import { getChipActionStyles } from '../Chip/chipSharedStyles';

export type { ChipLinkOwnProps, ChipLinkProps } from './ChipLink.types';

const useUtilityClasses = (ownerState: ChipLinkOwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ['root'],
  };

  return composeClasses(slots, getChipLinkUtilityClass, classes);
};

const ChipLinkRoot = styled('a', {
  name: 'MuiChipLink',
  slot: 'Root',
  overridesResolver: (_props, styles) => styles.root,
})<{ ownerState: ChipLinkOwnerState }>(memoTheme(() => getChipActionStyles()));

/**
 * An action overlay for the `Chip` component with link semantics.
 *
 * Must be used as the `action` prop of a `Chip`:
 *
 * ```jsx
 * <Chip label="Visit" action={<ChipLink href="/page" />} />
 * ```
 *
 * Intentionally ignores the parent Chip's `disabled` state because links should
 * always remain navigable. When used with a disabled Chip, the link stays enabled
 * and the Chip root suppresses disabled styling.
 *
 * Demos:
 *
 * - [Chip](https://next.mui.com/material-ui/react-chip/)
 *
 * API:
 *
 * - [ChipLink API](https://next.mui.com/material-ui/api/chip-link/)
 */
const ChipLink = React.forwardRef<HTMLAnchorElement, ChipLinkProps>(
  function ChipLink(inProps, ref) {
    const props = useDefaultProps({ props: inProps, name: 'MuiChipLink' });
    const {
      className,
      href,
      onClick,
      onFocus,
      onBlur,
      onKeyDown,
      onKeyUp,
      // Ripple-related handlers — extracted so they only flow through getRippleHandlers
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      onDragLeave,
      onTouchStart,
      onTouchEnd,
      onTouchMove,
      onContextMenu,
      ...other
    } = props;

    const chipContext = React.useContext(ChipContext);

    if (process.env.NODE_ENV !== 'production') {
      if (chipContext.variant === undefined) {
        console.error('MUI: <ChipLink> must be used as the `action` prop of a <Chip> component.');
      }
    }

    const { handleFocus, handleBlur, getRippleHandlers, enableTouchRipple, touchRippleRef } =
      useChipInteraction({ onFocus, onBlur });

    const ownerState: ChipLinkOwnerState = props;

    const classes = useUtilityClasses(ownerState);

    const rippleHandlers = getRippleHandlers({
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      onDragLeave,
      onTouchStart,
      onTouchEnd,
      onTouchMove,
      onContextMenu,
    });

    return (
      <ChipLinkRoot
        ref={ref}
        className={clsx(classes.root, className)}
        ownerState={ownerState}
        href={href}
        onClick={onClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        {...other}
        {...rippleHandlers}
      >
        {chipContext.labelElement}
        {enableTouchRipple ? <TouchRippleComponent ref={touchRippleRef} /> : null}
      </ChipLinkRoot>
    );
  },
);

ChipLink.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The URL to link to.
   */
  href: PropTypes.string.isRequired,
  /**
   * @ignore
   */
  onBlur: PropTypes.func,
  /**
   * @ignore
   */
  onClick: PropTypes.func,
  /**
   * @ignore
   */
  onContextMenu: PropTypes.func,
  /**
   * @ignore
   */
  onDragLeave: PropTypes.func,
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
   * @ignore
   */
  onMouseDown: PropTypes.func,
  /**
   * @ignore
   */
  onMouseLeave: PropTypes.func,
  /**
   * @ignore
   */
  onMouseUp: PropTypes.func,
  /**
   * @ignore
   */
  onTouchEnd: PropTypes.func,
  /**
   * @ignore
   */
  onTouchMove: PropTypes.func,
  /**
   * @ignore
   */
  onTouchStart: PropTypes.func,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])),
    PropTypes.func,
    PropTypes.object,
  ]),
} as any;

(ChipLink as any).muiName = 'ChipLink';

export default ChipLink;
