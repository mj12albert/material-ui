import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
import generateUtilityClass from '@mui/utils/generateUtilityClass';

export interface ChipButtonClasses {
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
  /** State class applied to the root element if `disabled={true}`. */
  disabled: string;
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

export type ChipButtonClassKey = keyof ChipButtonClasses;

export function getChipButtonUtilityClass(slot: string): string {
  return generateUtilityClass('MuiChipButton', slot);
}

const chipButtonClasses: ChipButtonClasses = generateUtilityClasses('MuiChipButton', [
  'root',
  'action',
  'label',
  'icon',
  'deleteButton',
  'disabled',
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

export default chipButtonClasses;
