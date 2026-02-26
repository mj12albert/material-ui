import type { Theme } from '../styles';
import createSimplePaletteValueFilter from '../utils/createSimplePaletteValueFilter';

// Palette accessed with a dynamic color key from Object.entries(theme.palette).
// The `createSimplePaletteValueFilter` guarantees the entry is a valid palette color,
// but TypeScript can't narrow `string` to specific palette keys.
const p = (theme: Theme, color: string) =>
  ((theme.vars || theme).palette as Record<string, any>)[color] as {
    main: string;
    dark: string;
    contrastText: string;
  };

/**
 * Class references needed by root styles for state-dependent selectors.
 * Each consumer (ChipButton, ChipLink) passes its own class constants.
 */
interface ChipRootClassRefs {
  focusVisible: string;
  disabled?: string | undefined;
}

/**
 * Root element styles shared by ChipButton and ChipLink.
 *
 * The root acts as either the interactive element itself (non-overlay mode)
 * or a container div (overlay mode). The `interactive` ownerState flag
 * controls which styles are applied, driven by the `variants` array.
 */
export function getChipRootStyles(theme: Theme, classes: ChipRootClassRefs) {
  return {
    maxWidth: '100%',
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.pxToRem(13),
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    lineHeight: 1.5,
    color: (theme.vars || theme).palette.text.primary,
    backgroundColor: (theme.vars || theme).palette.action.selected,
    borderRadius: 32 / 2,
    whiteSpace: 'nowrap' as const,
    transition: theme.transitions.create(['background-color', 'box-shadow']),
    cursor: 'unset',
    outline: 0,
    textDecoration: 'none',
    border: 0,
    padding: 0,
    verticalAlign: 'middle',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    ...(classes.disabled && {
      [`&.${classes.disabled}`]: {
        opacity: (theme.vars || theme).palette.action.disabledOpacity,
        pointerEvents: 'none',
      },
    }),
    variants: [
      // ---- Size ----
      {
        props: { size: 'small' },
        style: {
          height: 24,
        },
      },
      // ---- Colors (filled) ----
      ...Object.entries(theme.palette)
        .filter(createSimplePaletteValueFilter(['contrastText']))
        .map(([color]) => ({
          props: { color },
          style: {
            backgroundColor: p(theme, color).main,
            color: p(theme, color).contrastText,
          },
        })),
      // ---- Interactive (non-overlay) ----
      {
        props: { interactive: true },
        style: {
          userSelect: 'none' as const,
          WebkitTapHighlightColor: 'transparent',
          cursor: 'pointer',
          [`&.${classes.focusVisible}`]: {
            backgroundColor: theme.alpha(
              (theme.vars || theme).palette.action.selected,
              `${(theme.vars || theme).palette.action.selectedOpacity} + ${(theme.vars || theme).palette.action.focusOpacity}`,
            ),
          },
          '&:hover': {
            backgroundColor: theme.alpha(
              (theme.vars || theme).palette.action.selected,
              `${(theme.vars || theme).palette.action.selectedOpacity} + ${(theme.vars || theme).palette.action.hoverOpacity}`,
            ),
          },
          '&:active': {
            boxShadow: (theme.vars || theme).shadows[1],
          },
        },
      },
      // ---- Interactive + color ----
      ...Object.entries(theme.palette)
        .filter(createSimplePaletteValueFilter(['dark']))
        .map(([color]) => ({
          props: { color, interactive: true },
          style: {
            [`&:hover, &.${classes.focusVisible}`]: {
              backgroundColor: p(theme, color).dark,
            },
          },
        })),
      // ---- Overlay mode (hasDelete): root is <div>, hover triggered by nested action ----
      {
        props: { interactive: false },
        style: {
          [`&.${classes.focusVisible}`]: {
            backgroundColor: theme.alpha(
              (theme.vars || theme).palette.action.selected,
              `${(theme.vars || theme).palette.action.selectedOpacity} + ${(theme.vars || theme).palette.action.focusOpacity}`,
            ),
          },
          '&:hover': {
            backgroundColor: theme.alpha(
              (theme.vars || theme).palette.action.selected,
              `${(theme.vars || theme).palette.action.selectedOpacity} + ${(theme.vars || theme).palette.action.hoverOpacity}`,
            ),
          },
        },
      },
      ...Object.entries(theme.palette)
        .filter(createSimplePaletteValueFilter(['dark']))
        .map(([color]) => ({
          props: { color, interactive: false },
          style: {
            [`&:hover, &.${classes.focusVisible}`]: {
              backgroundColor: p(theme, color).dark,
            },
          },
        })),
      // ---- Outlined variant ----
      {
        props: { variant: 'outlined' },
        style: {
          backgroundColor: 'transparent',
          border: theme.vars
            ? `1px solid ${theme.vars.palette.Chip.defaultBorder}`
            : `1px solid ${
                theme.palette.mode === 'light'
                  ? theme.palette.grey[400]
                  : theme.palette.grey[700]
              }`,
          [`&.${classes.focusVisible}`]: {
            backgroundColor: (theme.vars || theme).palette.action.focus,
          },
          '&:hover': {
            backgroundColor: (theme.vars || theme).palette.action.hover,
          },
        },
      },
      // ---- Outlined + color ----
      ...Object.entries(theme.palette)
        .filter(createSimplePaletteValueFilter())
        .map(([color]) => ({
          props: { variant: 'outlined', color },
          style: {
            color: p(theme, color).main,
            border: `1px solid ${theme.alpha(p(theme, color).main, 0.7)}`,
            '&:hover': {
              backgroundColor: theme.alpha(
                p(theme, color).main,
                (theme.vars || theme).palette.action.hoverOpacity,
              ),
            },
            [`&.${classes.focusVisible}`]: {
              backgroundColor: theme.alpha(
                p(theme, color).main,
                (theme.vars || theme).palette.action.focusOpacity,
              ),
            },
          },
        })),
    ],
  };
}

/**
 * Action overlay styles (the `<button>` or `<a>` positioned absolutely over the root).
 * Only rendered when `onDelete` is provided (overlay mode).
 */
export function getChipActionStyles(theme: Theme, focusVisibleClass: string) {
  return {
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
    [`&.${focusVisibleClass}`]: {
      outline: `2px solid ${(theme.vars || theme).palette.primary.main}`,
      outlineOffset: 2,
    },
    '&:disabled, &[aria-disabled="true"]': {
      cursor: 'not-allowed',
    },
  };
}

/**
 * Label element styles.
 */
export function getChipLabelStyles() {
  return {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingLeft: 12,
    paddingRight: 12,
    whiteSpace: 'nowrap' as const,
    position: 'relative' as const,
    zIndex: 1,
    variants: [
      {
        props: { variant: 'outlined' },
        style: {
          paddingLeft: 11,
          paddingRight: 11,
        },
      },
      {
        props: { size: 'small' },
        style: {
          paddingLeft: 8,
          paddingRight: 8,
        },
      },
      {
        props: { size: 'small', variant: 'outlined' },
        style: {
          paddingLeft: 7,
          paddingRight: 7,
        },
      },
    ],
  };
}

/**
 * Delete button styles.
 */
export function getChipDeleteStyles(theme: Theme) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
    color: theme.alpha((theme.vars || theme).palette.text.primary, 0.26),
    fontSize: 22,
    cursor: 'pointer',
    padding: 0,
    margin: '0 5px 0 -6px',
    border: 'none',
    backgroundColor: 'transparent',
    position: 'relative' as const,
    zIndex: 1,
    pointerEvents: 'auto' as const,
    borderRadius: '50%',
    '&:hover': {
      color: theme.alpha((theme.vars || theme).palette.text.primary, 0.4),
    },
    '&:focus-visible': {
      outline: `2px solid ${(theme.vars || theme).palette.primary.main}`,
      outlineOffset: 2,
    },
    '&:disabled, &[aria-disabled="true"]': {
      opacity: (theme.vars || theme).palette.action.disabledOpacity,
      cursor: 'not-allowed',
      '&:hover': {
        color: theme.alpha((theme.vars || theme).palette.text.primary, 0.26),
      },
    },
    variants: [
      {
        props: { size: 'small' },
        style: {
          fontSize: 16,
          marginRight: 4,
          marginLeft: -4,
        },
      },
      // Per-color delete icon colors
      ...Object.entries(theme.palette)
        .filter(createSimplePaletteValueFilter(['contrastText']))
        .map(([color]) => ({
          props: { color },
          style: {
            color: theme.alpha(p(theme, color).contrastText, 0.7),
            '&:hover, &:active': {
              color: p(theme, color).contrastText,
            },
          },
        })),
      // Outlined + color delete icon colors
      ...Object.entries(theme.palette)
        .filter(createSimplePaletteValueFilter())
        .map(([color]) => ({
          props: { variant: 'outlined', color },
          style: {
            color: theme.alpha(p(theme, color).main, 0.7),
            '&:hover, &:active': {
              color: p(theme, color).main,
            },
          },
        })),
    ],
  };
}

/**
 * Icon wrapper styles.
 */
export function getChipIconStyles(theme: Theme) {
  const textColor =
    theme.palette.mode === 'light' ? theme.palette.grey[700] : theme.palette.grey[300];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: -6,
    position: 'relative' as const,
    zIndex: 1,
    pointerEvents: 'none' as const,
    '& .MuiSvgIcon-root': {
      fontSize: 20,
    },
    '& .MuiAvatar-root': {
      width: 24,
      height: 24,
      color: theme.vars ? theme.vars.palette.Chip.defaultAvatarColor : textColor,
      fontSize: theme.typography.pxToRem(12),
    },
    variants: [
      {
        props: { size: 'small' },
        style: {
          marginLeft: 4,
          marginRight: -4,
          '& .MuiSvgIcon-root': {
            fontSize: 18,
          },
          '& .MuiAvatar-root': {
            width: 18,
            height: 18,
            fontSize: theme.typography.pxToRem(10),
          },
        },
      },
      {
        props: { variant: 'outlined' },
        style: {
          marginLeft: 4,
        },
      },
      {
        props: { variant: 'outlined', size: 'small' },
        style: {
          marginLeft: 2,
        },
      },
      // Avatar color adjustments per chip color
      ...Object.entries(theme.palette)
        .filter(createSimplePaletteValueFilter(['contrastText', 'dark']))
        .map(([color]) => ({
          props: { color },
          style: {
            '& .MuiAvatar-root': {
              color: p(theme, color).contrastText,
              backgroundColor: p(theme, color).dark,
            },
          },
        })),
      // ---- Icon color tracking (scoped to icon slot, not delete icon) ----
      {
        props: (props: Record<string, any>) => props.iconColor === props.color,
        style: {
          '& .MuiSvgIcon-root': {
            color: theme.vars ? theme.vars.palette.Chip.defaultIconColor : textColor,
          },
        },
      },
      {
        props: (props: Record<string, any>) =>
          props.iconColor === props.color && props.color !== 'default',
        style: {
          '& .MuiSvgIcon-root': {
            color: 'inherit',
          },
        },
      },
    ],
  };
}
