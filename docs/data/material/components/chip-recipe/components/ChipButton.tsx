import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { mergeProps } from '@base-ui/react/merge-props';
import {
  type ChipButtonProps,
  type ChipOwnerState,
  useChipDeleteKeyHandlers,
  DefaultDeleteIcon,
  StyledChipButtonRoot,
  StyledChipDivRoot,
  StyledChipButtonAction,
  StyledChipLabel,
  StyledChipDelete,
  StyledChipIcon,
} from './shared';

/**
 * A chip component with button semantics.
 *
 * - Without `onDelete`: root IS a `<button>` (1 tab stop)
 * - With `onDelete`: root is a `<div>` with an action `<button>` overlay + delete `<button>` (2 tab stops)
 */
export default function ChipButton(props: ChipButtonProps) {
  const {
    label,
    icon,
    avatar,
    onClick,
    onDelete,
    deleteIcon,
    deleteLabel = 'Remove',
    disabled = false,
    focusableWhenDisabled = true,
    size = 'medium',
    color = 'default',
    variant = 'filled',
    sx,
    ...other
  } = props;

  const labelId = React.useId();
  const hasDelete = Boolean(onDelete);
  const iconElement = avatar || icon;
  const actionKeyHandlers = useChipDeleteKeyHandlers(onDelete);

  // In overlay mode, split `other` so visual props go to the root <div>
  // and semantic/interactive props go to the action <button>.
  const { className, id, style: styleProp, ...actionProps } = other;

  const ownerState: ChipOwnerState = {
    color,
    variant,
    size,
    disabled,
    interactive: !hasDelete,
  };

  const iconNode = iconElement ? (
    <StyledChipIcon ownerState={{ size }} aria-hidden>
      {iconElement}
    </StyledChipIcon>
  ) : null;

  // In overlay mode (hasDelete), label gets pointerEvents: 'none' so clicks
  // pass through to the action <button> underneath — ensuring focus moves to
  // the action control when the user clicks the label area.
  const labelNode = (
    <StyledChipLabel
      id={hasDelete ? labelId : undefined}
      style={hasDelete ? { pointerEvents: 'none' } : undefined}
    >
      {label}
    </StyledChipLabel>
  );

  const deleteNode = onDelete ? (
    <BaseButton
      disabled={disabled}
      focusableWhenDisabled={focusableWhenDisabled}
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

  // -- Mode 1: Without onDelete — root IS the <button> --
  if (!hasDelete) {
    return (
      <BaseButton
        disabled={disabled}
        focusableWhenDisabled={focusableWhenDisabled}
        onClick={onClick}
        render={<StyledChipButtonRoot ownerState={ownerState} sx={sx} />}
        {...other}
      >
        {iconNode}
        {labelNode}
      </BaseButton>
    );
  }

  // -- Mode 2: With onDelete — overlay pattern --
  return (
    <StyledChipDivRoot ownerState={ownerState} sx={sx} className={className} id={id} style={styleProp}>
      <BaseButton
        disabled={disabled}
        focusableWhenDisabled={focusableWhenDisabled}
        aria-labelledby={labelId}
        onClick={onClick}
        render={<StyledChipButtonAction />}
        {...mergeProps(actionKeyHandlers, actionProps)}
      />
      {iconNode}
      {labelNode}
      {deleteNode}
    </StyledChipDivRoot>
  );
}
