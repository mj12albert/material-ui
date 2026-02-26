import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
import generateUtilityClass from '@mui/utils/generateUtilityClass';

export interface ChipLinkClasses {
  /** Styles applied to the root element. */
  root: string;
  /** Styles applied to the action overlay element (present only when onDelete is provided). */
  action: string;
  /** Styles applied to the label element. */
  label: string;
  /** Styles applied to the icon wrapper element. */
  icon: string;
  /** Styles applied to the delete button element. */
  deleteButton: string;
  /** State class applied when the chip is keyboard-focused. */
  focusVisible: string;
  /** Styles applied to the root element if `size="small"`. */
  sizeSmall: string;
  /** Styles applied to the root element if `size="medium"`. */
  sizeMedium: string;
  /** Styles applied to the root element if `color="default"`. */
  colorDefault: string;
  /** Styles applied to the root element if `color="primary"`. */
  colorPrimary: string;
  /** Styles applied to the root element if `color="secondary"`. */
  colorSecondary: string;
  /** Styles applied to the root element if `color="error"`. */
  colorError: string;
  /** Styles applied to the root element if `color="info"`. */
  colorInfo: string;
  /** Styles applied to the root element if `color="success"`. */
  colorSuccess: string;
  /** Styles applied to the root element if `color="warning"`. */
  colorWarning: string;
  /** Styles applied to the root element if `variant="filled"`. */
  filled: string;
  /** Styles applied to the root element if `variant="outlined"`. */
  outlined: string;
}

export type ChipLinkClassKey = keyof ChipLinkClasses;

export function getChipLinkUtilityClass(slot: string): string {
  return generateUtilityClass('MuiChipLink', slot);
}

const chipLinkClasses: ChipLinkClasses = generateUtilityClasses('MuiChipLink', [
  'root',
  'action',
  'label',
  'icon',
  'deleteButton',
  'focusVisible',
  'sizeSmall',
  'sizeMedium',
  'colorDefault',
  'colorPrimary',
  'colorSecondary',
  'colorError',
  'colorInfo',
  'colorSuccess',
  'colorWarning',
  'filled',
  'outlined',
]);

export default chipLinkClasses;
