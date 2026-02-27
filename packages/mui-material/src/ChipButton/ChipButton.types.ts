import * as React from 'react';
import { OverridableStringUnion } from '@mui/types';
import { SxProps } from '@mui/system';
import { CreateSlotsAndSlotProps, SlotProps } from '../utils/types';
import { Theme } from '../styles';
import { ChipButtonClasses } from './chipButtonClasses';

export interface ChipButtonSlots {
  /**
   * The component that renders the root.
   * @default div
   */
  root: React.ElementType;
  /**
   * The component that renders the action overlay (present only when onDelete is provided).
   * @default button
   */
  action: React.ElementType;
  /**
   * The component that renders the label.
   * @default span
   */
  label: React.ElementType;
  /**
   * The component that renders the delete button.
   * @default button
   */
  deleteButton: React.ElementType;
  /**
   * The component that renders the icon wrapper.
   * @default span
   */
  icon: React.ElementType;
}

export type ChipButtonSlotsAndSlotProps = CreateSlotsAndSlotProps<
  ChipButtonSlots,
  {
    /**
     * Props forwarded to the root slot.
     * By default, the available props are based on the div element.
     */
    root: SlotProps<'div', {}, ChipButtonOwnerState>;
    /**
     * Props forwarded to the action slot.
     * By default, the available props are based on the button element.
     */
    action: SlotProps<'button', {}, ChipButtonOwnerState>;
    /**
     * Props forwarded to the label slot.
     * By default, the available props are based on the span element.
     */
    label: SlotProps<'span', {}, ChipButtonOwnerState>;
    /**
     * Props forwarded to the deleteButton slot.
     * By default, the available props are based on the button element.
     */
    deleteButton: SlotProps<'button', {}, ChipButtonOwnerState>;
    /**
     * Props forwarded to the icon slot.
     * By default, the available props are based on the span element.
     */
    icon: SlotProps<'span', {}, ChipButtonOwnerState>;
  }
>;

export interface ChipButtonOwnerState extends Omit<ChipButtonProps, 'slots' | 'slotProps'> {
  hasDelete: boolean;
  interactive: boolean;
  focusVisible: boolean;
  iconColor: string;
}

export interface ChipButtonPropsVariantOverrides {}

export interface ChipButtonPropsSizeOverrides {}

export interface ChipButtonPropsColorOverrides {}

export interface ChipButtonOwnProps extends ChipButtonSlotsAndSlotProps {
  /**
   * The Avatar element to display.
   */
  avatar?: React.ReactElement<unknown> | undefined;
  /**
   * Override or extend the styles applied to the component.
   */
  classes?: Partial<ChipButtonClasses> | undefined;
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'default'
   */
  color?:
    | OverridableStringUnion<
        'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning',
        ChipButtonPropsColorOverrides
      >
    | undefined;
  /**
   * Override the default delete icon element. Shown only if `onDelete` is set.
   */
  deleteIcon?: React.ReactElement<unknown> | undefined;
  /**
   * The accessible label for the delete button.
   * @default 'Remove'
   */
  deleteLabel?: string | undefined;
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * If `true`, the disabled chip can receive focus.
   * @default true
   */
  focusableWhenDisabled?: boolean | undefined;
  /**
   * Icon element.
   */
  icon?: React.ReactElement<unknown> | undefined;
  /**
   * The content of the component.
   */
  label?: React.ReactNode;
  /**
   * Callback fired when the delete icon is clicked.
   * If set, the delete icon will be shown.
   */
  onDelete?: React.EventHandler<React.SyntheticEvent> | undefined;
  /**
   * @ignore
   */
  onClick?: React.MouseEventHandler<HTMLElement> | undefined;
  /**
   * @ignore
   */
  onFocus?: React.FocusEventHandler<HTMLElement> | undefined;
  /**
   * @ignore
   */
  onBlur?: React.FocusEventHandler<HTMLElement> | undefined;
  /**
   * @ignore
   */
  onKeyDown?: React.KeyboardEventHandler<HTMLElement> | undefined;
  /**
   * @ignore
   */
  onKeyUp?: React.KeyboardEventHandler<HTMLElement> | undefined;
  /**
   * The size of the component.
   * @default 'medium'
   */
  size?: OverridableStringUnion<'small' | 'medium', ChipButtonPropsSizeOverrides> | undefined;
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx?: SxProps<Theme> | undefined;
  /**
   * @ignore
   */
  tabIndex?: number | undefined;
  /**
   * The variant to use.
   * @default 'filled'
   */
  variant?:
    | OverridableStringUnion<'filled' | 'outlined', ChipButtonPropsVariantOverrides>
    | undefined;
}

export type ChipButtonProps = ChipButtonOwnProps &
  Omit<
    React.ComponentPropsWithoutRef<'button'>,
    'children' | 'color' | 'type' | 'onClick' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onKeyUp'
  >;
