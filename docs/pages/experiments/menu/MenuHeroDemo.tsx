import * as React from 'react';
import type { Menu } from '@base-ui/react/menu';
import {
  MenuRoot,
  MenuTrigger,
  MenuPortal,
  MenuPositioner,
  MenuPopup,
  MenuItem,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
  MenuSeparator,
} from './components';

function getSubmenuOffset({ side }: { side: Menu.Positioner.Props['side'] }) {
  return side === 'top' || side === 'bottom' ? 4 : -4;
}

export default function MenuHeroDemo() {
  return (
    <MenuRoot>
      <MenuTrigger variant="outlined">Song</MenuTrigger>
      <MenuPortal>
        <MenuPositioner align="start" sideOffset={8}>
          <MenuPopup>
            <MenuItem>Add to Library</MenuItem>

            <MenuSubmenuRoot>
              <MenuSubmenuTrigger>Add to Playlist</MenuSubmenuTrigger>
              <MenuPortal>
                <MenuPositioner sideOffset={getSubmenuOffset} alignOffset={getSubmenuOffset}>
                  <MenuPopup>
                    <MenuItem>Get Up!</MenuItem>
                    <MenuItem>Inside Out</MenuItem>
                    <MenuItem>Night Beats</MenuItem>
                    <MenuSeparator />
                    <MenuItem>New playlist…</MenuItem>
                  </MenuPopup>
                </MenuPositioner>
              </MenuPortal>
            </MenuSubmenuRoot>

            <MenuSeparator />
            <MenuItem>Play Next</MenuItem>
            <MenuItem>Play Last</MenuItem>
            <MenuSeparator />
            <MenuItem>Favorite</MenuItem>
            <MenuItem>Share</MenuItem>
          </MenuPopup>
        </MenuPositioner>
      </MenuPortal>
    </MenuRoot>
  );
}
