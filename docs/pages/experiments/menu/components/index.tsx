import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button, { type ButtonProps } from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItemButton, { type ListItemButtonProps } from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader, { type ListSubheaderProps } from '@mui/material/ListSubheader';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Divider, { type DividerProps } from '@mui/material/Divider';

export const MenuRoot = BaseMenu.Root;
export const MenuPortal = BaseMenu.Portal;
export const MenuPositioner = BaseMenu.Positioner;

const StyledArrowDropDownIcon = styled(ArrowDropDownIcon)({
  transition: 'transform 150ms',
  '[data-popup-open] &': {
    transform: 'rotate(180deg)',
  },
});

export function MenuTrigger(
  props: BaseMenu.Trigger.Props & Pick<ButtonProps, 'variant'>,
) {
  const { variant, ...other } = props;
  return (
    <BaseMenu.Trigger
      render={<Button variant={variant} endIcon={<StyledArrowDropDownIcon />} />}
      {...other}
    />
  );
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  minWidth: 160,
  paddingBlock: theme.spacing(0.5),
  transformOrigin: 'var(--transform-origin)',
  '&[data-starting-style], &[data-ending-style]': {
    opacity: 0,
    transform: 'scale(0.95)',
  },
}));

export function MenuPopup(props: BaseMenu.Popup.Props) {
  return (
    <BaseMenu.Popup
      render={(renderProps) => (
        <StyledPaper elevation={8}>
          <List component="div" disablePadding sx={{ outline: 'none' }} {...renderProps}>
            {props.children}
          </List>
        </StyledPaper>
      )}
      {...props}
    />
  );
}

interface MenuItemExtendedProps {
  icon?: React.ReactNode;
  secondary?: React.ReactNode;
}

export function MenuItem(
  props: BaseMenu.Item.Props & Pick<ListItemButtonProps, 'sx'> & MenuItemExtendedProps,
) {
  const { sx, icon, children, secondary, ...other } = props;
  return (
    <BaseMenu.Item
      render={<ListItemButton dense sx={[{ gap: 1.5 }, ...(Array.isArray(sx) ? sx : [sx])]} />}
      {...other}
    >
      {icon && <ListItemIcon sx={{ minWidth: 'unset' }}>{icon}</ListItemIcon>}
      <ListItemText secondary={secondary}>{children}</ListItemText>
    </BaseMenu.Item>
  );
}

export function MenuSubmenuRoot(props: BaseMenu.SubmenuRoot.Props) {
  return <BaseMenu.SubmenuRoot {...props} />;
}

export function MenuSubmenuTrigger(
  props: BaseMenu.SubmenuTrigger.Props &
    Pick<ListItemButtonProps, 'sx'> &
    Pick<MenuItemExtendedProps, 'icon'>,
) {
  const { sx, icon, children, ...other } = props;
  return (
    <BaseMenu.SubmenuTrigger render={<ListItemButton dense sx={sx} />} {...other}>
      {icon && <ListItemIcon sx={{ minWidth: 'unset' }}>{icon}</ListItemIcon>}
      <ListItemText>{children}</ListItemText>
      <ChevronRightIcon fontSize="small" sx={{ mr: -1 }} />
    </BaseMenu.SubmenuTrigger>
  );
}

export function MenuGroup(props: BaseMenu.Group.Props) {
  return <BaseMenu.Group render={<Box sx={{ position: 'relative' }} />} {...props} />;
}

export function MenuGroupLabel(props: BaseMenu.GroupLabel.Props & Pick<ListSubheaderProps, 'sx'>) {
  const { sx, ...other } = props;
  return (
    <BaseMenu.GroupLabel
      render={
        <ListSubheader
          component="div"
          sx={[
            (theme) => ({
              position: 'initial',
              py: 1,
              ...theme.typography.overline,
              lineHeight: '1.5',
            }),
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        />
      }
      {...other}
    />
  );
}

export function MenuSeparator(props: BaseMenu.Separator.Props & Pick<DividerProps, 'sx'>) {
  const { sx, ...other } = props;
  return (
    <BaseMenu.Separator
      render={<Divider sx={[{ my: 0.5 }, ...(Array.isArray(sx) ? sx : [sx])]} />}
      {...other}
    />
  );
}
