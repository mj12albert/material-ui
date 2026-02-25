import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { mergeProps } from '@base-ui/react/merge-props';
import {
  type ChipLinkProps,
  type ChipOwnerState,
  useChipDeleteKeyHandlers,
  DefaultDeleteIcon,
  StyledChipAnchorRoot,
  StyledChipDivRoot,
  StyledChipAnchorAction,
  StyledChipLabel,
  StyledChipDelete,
  StyledChipIcon,
} from './shared';

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
export default function ChipLink(props: ChipLinkProps) {
  const {
    label,
    icon,
    avatar,
    href,
    onDelete,
    deleteIcon,
    deleteLabel = 'Delete',
    size = 'medium',
    color = 'default',
    variant = 'filled',
    sx,
    ...other
  } = props;

  const labelId = React.useId();
  const hasDelete = Boolean(onDelete);
  const iconElement = avatar || icon;
  const actionKeyHandlers = useChipDeleteKeyHandlers(hasDelete, onDelete);

  // In overlay mode, split `other` so visual props go to the root <div>
  // and semantic/interactive props (target, rel, aria-*) go to the action <a>.
  const { className, id, style: styleProp, ...actionProps } = other;

  const ownerState: ChipOwnerState = {
    color,
    variant,
    size,
    disabled: false,
    interactive: !hasDelete,
  };

  const iconNode = iconElement ? (
    <StyledChipIcon ownerState={{ size }} aria-hidden>
      {iconElement}
    </StyledChipIcon>
  ) : null;

  const deleteNode = onDelete ? (
    <BaseButton
      render={
        <StyledChipDelete ownerState={{ size }}>
          {deleteIcon || <DefaultDeleteIcon />}
        </StyledChipDelete>
      }
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation();
        onDelete(event);
      }}
      aria-label={deleteLabel}
    />
  ) : null;

  // -- Mode 1: Without onDelete — root IS the <a> --
  if (!hasDelete) {
    return (
      <StyledChipAnchorRoot href={href} ownerState={ownerState} sx={sx} {...other}>
        {iconNode}
        <StyledChipLabel>{label}</StyledChipLabel>
      </StyledChipAnchorRoot>
    );
  }

  // -- Mode 2: With onDelete — overlay pattern --
  // Label gets pointerEvents: 'none' so clicks pass through to the <a> action
  return (
    <StyledChipDivRoot ownerState={ownerState} sx={sx} className={className} id={id} style={styleProp}>
      <StyledChipAnchorAction
        href={href}
        aria-labelledby={labelId}
        {...mergeProps(actionKeyHandlers, actionProps)}
      />
      {iconNode}
      <StyledChipLabel id={labelId} style={{ pointerEvents: 'none' }}>
        {label}
      </StyledChipLabel>
      {deleteNode}
    </StyledChipDivRoot>
  );
}
