import * as React from 'react';
import { alpha, styled, type SxProps, type Theme } from '@mui/material/styles';
import CancelIcon from '@mui/icons-material/Cancel';

// ----- Types -----

export interface ChipOwnerState {
  color:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  variant: 'filled' | 'outlined';
  size: 'small' | 'medium';
  disabled: boolean;
  /** Root is a semantic interactive element (<button> or <a>), not a <div> overlay container */
  interactive: boolean;
}

interface NativeButtonProps extends Omit<
  React.ComponentPropsWithoutRef<'button'>,
  'children' | 'color'
> {}

interface NativeAnchorProps extends Omit<
  React.ComponentPropsWithoutRef<'a'>,
  'children' | 'color' | 'href'
> {}

export interface ChipButtonProps extends NativeButtonProps {
  label: React.ReactNode;
  icon?: React.ReactElement;
  avatar?: React.ReactElement;
  onDelete?: React.EventHandler<any>;
  deleteIcon?: React.ReactElement;
  deleteLabel?: string;
  focusableWhenDisabled?: boolean;
  size?: 'small' | 'medium';
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  variant?: 'filled' | 'outlined';
  sx?: SxProps<Theme>;
}

export interface ChipLinkProps extends NativeAnchorProps {
  label: React.ReactNode;
  icon?: React.ReactElement;
  avatar?: React.ReactElement;
  href: string;
  onDelete?: React.EventHandler<any>;
  deleteIcon?: React.ReactElement;
  deleteLabel?: string;
  size?: 'small' | 'medium';
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  variant?: 'filled' | 'outlined';
  sx?: SxProps<Theme>;
}

// ----- Keyboard helpers -----

function isDeleteKeyboardEvent(event: React.KeyboardEvent) {
  return event.key === 'Backspace' || event.key === 'Delete';
}

/**
 * Returns onKeyDown/onKeyUp handlers for the chip action element (button or link).
 * These fire `onDelete` on Backspace/Delete keystrokes.
 * Only applied to the action element — NOT the delete button.
 */
export function useChipDeleteKeyHandlers(onDelete?: React.EventHandler<any>) {
  if (!onDelete) {
    return {};
  }
  return {
    onKeyDown: (event: React.KeyboardEvent) => {
      if (isDeleteKeyboardEvent(event)) {
        event.preventDefault();
      }
    },
    onKeyUp: (event: React.KeyboardEvent) => {
      if (isDeleteKeyboardEvent(event)) {
        onDelete(event);
      }
    },
  };
}

// ----- Default delete icon -----

export function DefaultDeleteIcon() {
  return <CancelIcon fontSize="inherit" />;
}

// ----- Styled components -----

const shouldForwardProp = (prop: string) => prop !== 'ownerState';

/**
 * Shared style function for the chip root element.
 * Applied to separate styled components for <div>, <button>, and <a>.
 */
function chipRootStyles({
  theme,
  ownerState,
}: {
  theme: Theme;
  ownerState: ChipOwnerState;
}) {
  const filledBg =
    ownerState.color === 'default'
      ? (theme.vars || theme).palette.action.selected
      : (theme.vars || theme).palette[ownerState.color].main;
  const filledFg =
    ownerState.color === 'default'
      ? (theme.vars || theme).palette.text.primary
      : (theme.vars || theme).palette[ownerState.color].contrastText;
  let defaultOutlinedBorder = theme.palette.grey[700];
  if (theme.vars) {
    defaultOutlinedBorder = theme.vars.palette.Chip.defaultBorder;
  } else if (theme.palette.mode === 'light') {
    defaultOutlinedBorder = theme.palette.grey[400];
  }
  let hoverBg;
  if (ownerState.variant === 'filled') {
    hoverBg =
      ownerState.color === 'default'
        ? alpha(
            (theme.vars || theme).palette.action.selected as string,
            theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity,
          )
        : (theme.vars || theme).palette[ownerState.color].dark;
  } else {
    hoverBg =
      ownerState.color === 'default'
        ? (theme.vars || theme).palette.action.hover
        : alpha(
            (theme.vars || theme).palette[ownerState.color].main as string,
            theme.palette.action.hoverOpacity,
          );
  }

  return {
    // -- Base styles (all modes) --
    maxWidth: '100%',
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.pxToRem(13),
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ownerState.size === 'small' ? 24 : 32,
    lineHeight: 1.5,
    borderRadius: 16,
    whiteSpace: 'nowrap' as const,
    transition: theme.transitions.create(['background-color', 'box-shadow']),
    textDecoration: 'none',
    verticalAlign: 'middle',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,

    // -- Visual appearance (variant + color) --
    ...(ownerState.variant === 'filled' && {
      backgroundColor: filledBg,
      color: filledFg,
    }),
    ...(ownerState.variant === 'outlined' && {
      backgroundColor: 'transparent',
      color:
        ownerState.color === 'default'
          ? (theme.vars || theme).palette.text.primary
          : (theme.vars || theme).palette[ownerState.color].main,
      border: `1px solid ${
        ownerState.color === 'default'
          ? defaultOutlinedBorder
          : alpha(
              (theme.vars || theme).palette[ownerState.color].main as string,
              0.7,
            )
      }`,
    }),

    // -- Hover on root: works in ALL modes --
    ...(!ownerState.disabled && {
      '&:hover': {
        backgroundColor: hoverBg,
      },
    }),

    // -- Non-overlay mode: root IS the <button> or <a> --
    ...(ownerState.interactive && {
      cursor: 'pointer',
      // Reset browser default button border for filled variant only;
      // outlined variant's border is set in the variant block above.
      ...(ownerState.variant !== 'outlined' && { border: 0 }),
      padding: 0,
      userSelect: 'none' as const,
      WebkitTapHighlightColor: 'transparent',
      '&:focus-visible': {
        outline: `2px solid ${(theme.vars || theme).palette.primary.main}`,
        outlineOffset: 2,
      },
      ...(!ownerState.disabled && {
        '&:active': {
          boxShadow: (theme.vars || theme).shadows[1],
        },
      }),
    }),

    // -- Disabled --
    ...(ownerState.disabled && {
      opacity: (theme.vars || theme).palette.action.disabledOpacity,
      cursor: ownerState.interactive ? 'not-allowed' : 'default',
    }),
  };
}

type ChipRootProps = { ownerState: ChipOwnerState };

/** Root as <div> — used in overlay mode (with onDelete) */
export const StyledChipDivRoot = styled('div', { shouldForwardProp })<ChipRootProps>(
  chipRootStyles,
);

/** Root as <button> — used in ChipButton non-overlay mode (without onDelete) */
export const StyledChipButtonRoot = styled('button', {
  shouldForwardProp,
})<ChipRootProps>(chipRootStyles);

/** Root as <a> — used in ChipLink non-overlay mode (without onDelete) */
export const StyledChipAnchorRoot = styled('a', {
  shouldForwardProp,
})<ChipRootProps>(chipRootStyles);

/**
 * Shared style function for the action overlay element.
 */
const chipActionStyles = ({ theme }: { theme: Theme }) => ({
  position: 'absolute' as const,
  inset: 0,
  width: '100%',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  margin: 0,
  backgroundColor: 'transparent',
  borderRadius: 'inherit',
  zIndex: 0,
  color: 'inherit',
  font: 'inherit',
  textDecoration: 'none',
  WebkitTapHighlightColor: 'transparent',
  '&:focus-visible': {
    outline: `2px solid ${(theme.vars || theme).palette.primary.main}`,
    outlineOffset: 2,
  },
  '&:disabled, &[aria-disabled="true"]': {
    cursor: 'not-allowed',
  },
});

/** Action overlay as <button> — used in ChipButton overlay mode */
export const StyledChipButtonAction = styled('button')(chipActionStyles);

/** Action overlay as <a> — used in ChipLink overlay mode */
export const StyledChipAnchorAction = styled('a')(chipActionStyles);

export const StyledChipLabel = styled('span')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  paddingLeft: 12,
  paddingRight: 12,
  whiteSpace: 'nowrap',
  position: 'relative',
  zIndex: 1,
});

export const StyledChipDelete = styled('button', { shouldForwardProp })<{
  ownerState: { size: 'small' | 'medium' };
}>(({ theme, ownerState }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent',
  color: 'inherit',
  opacity: 0.7,
  fontSize: ownerState.size === 'small' ? 16 : 22,
  cursor: 'pointer',
  padding: 0,
  margin: ownerState.size === 'small' ? '0 4px 0 -4px' : '0 5px 0 -6px',
  border: 'none',
  backgroundColor: 'transparent',
  position: 'relative',
  zIndex: 1,
  pointerEvents: 'auto' as const,
  borderRadius: '50%',
  '&:hover': {
    opacity: 1,
  },
  '&:focus-visible': {
    outline: `2px solid ${(theme.vars || theme).palette.primary.main}`,
    outlineOffset: 2,
  },
  '&:disabled, &[aria-disabled="true"]': {
    opacity: 0.5,
    cursor: 'not-allowed',
    '&:hover': {
      opacity: 0.5,
    },
  },
}));

export const StyledChipIcon = styled('span', { shouldForwardProp })<{
  ownerState: { size: 'small' | 'medium' };
}>(({ ownerState }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: ownerState.size === 'small' ? 4 : 5,
  marginRight: ownerState.size === 'small' ? -4 : -6,
  position: 'relative',
  zIndex: 1,
  pointerEvents: 'none' as const,
  '& .MuiSvgIcon-root': {
    fontSize: ownerState.size === 'small' ? 18 : 20,
  },
  '& .MuiAvatar-root': {
    width: ownerState.size === 'small' ? 18 : 24,
    height: ownerState.size === 'small' ? 18 : 24,
  },
}));
