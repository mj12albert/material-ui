import * as React from 'react';
import TouchRipple, { TouchRippleActions, TouchRippleProps } from '../ButtonBase/TouchRipple';

// TouchRipple.d.ts declares ForwardRefRenderFunction instead of ForwardRefExoticComponent.
// Cast to the correct component type so it works as a JSX element.
export const TouchRippleComponent = TouchRipple as unknown as React.ForwardRefExoticComponent<
  React.RefAttributes<TouchRippleActions> & TouchRippleProps
>;

export function isDeleteKeyboardEvent(event: React.KeyboardEvent) {
  return event.key === 'Backspace' || event.key === 'Delete';
}
