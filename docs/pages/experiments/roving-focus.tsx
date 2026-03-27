import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Head from 'docs/src/modules/components/Head';
import { Link } from '@mui/docs/Link';

const MenuDivider = React.forwardRef<HTMLHRElement, React.ComponentPropsWithoutRef<typeof Divider>>(
  function MenuDivider(props, ref) {
    return <Divider ref={ref} {...props} />;
  },
);

interface ExampleFrameProps {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  instructions: string;
}

function ExampleFrame(props: ExampleFrameProps) {
  const { children, eyebrow, title, description, instructions } = props;

  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <div>
          <Typography variant="overline" color="text.secondary">
            {eyebrow}
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {instructions}
          </Typography>
        </div>
        {children}
      </Stack>
    </Paper>
  );
}

function FragmentAndDividerExample() {
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <ExampleFrame
      eyebrow="Fragments"
      title="Fragment-wrapped items and wrapped dividers"
      description="This menu mixes MenuItems inside React.Fragment with a Divider wrapper that used to accidentally join the tab sequence."
      instructions='Open the menu and use the arrow keys. The selected item should land on "Pin to right", both fragment groups should participate, and the divider wrapper should be skipped entirely.'
    >
      <Button ref={buttonRef} variant="contained" onClick={() => setOpen(true)}>
        Open fragment menu
      </Button>
      <Menu anchorEl={buttonRef.current} open={open} onClose={() => setOpen(false)}>
        <React.Fragment>
          <MenuItem>Sort ascending</MenuItem>
          <MenuItem>Sort descending</MenuItem>
        </React.Fragment>
        <MenuDivider />
        <React.Fragment>
          {null}
          <MenuItem>Pin to left</MenuItem>
          <MenuItem selected>Pin to right</MenuItem>
        </React.Fragment>
        <MenuDivider />
        <React.Fragment>
          <MenuItem>Filter</MenuItem>
          <MenuItem>Manage columns</MenuItem>
        </React.Fragment>
      </Menu>
    </ExampleFrame>
  );
}

function ConditionalInsertExample() {
  const [open, setOpen] = React.useState(false);
  const [showPinnedActions, setShowPinnedActions] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <ExampleFrame
      eyebrow="Conditional Rendering"
      title="Inserting items ahead of the active MenuItem"
      description="This example inserts a fragment before the selected item while the menu is already open."
      instructions='Open the menu, then toggle the extra block. Focus should stay anchored to "Reports" instead of jumping back to the start.'
    >
      <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button ref={buttonRef} variant="contained" onClick={() => setOpen(true)}>
          Open conditional menu
        </Button>
        <Button variant="outlined" onClick={() => setShowPinnedActions((previous) => !previous)}>
          {showPinnedActions ? 'Hide pinned actions' : 'Show pinned actions'}
        </Button>
      </Stack>
      <Menu anchorEl={buttonRef.current} open={open} onClose={() => setOpen(false)}>
        {showPinnedActions ? (
          <React.Fragment>
            <MenuItem>Pin to dashboard</MenuItem>
            <MenuItem>Send to favorites</MenuItem>
            <MenuDivider />
          </React.Fragment>
        ) : null}
        <MenuItem>Overview</MenuItem>
        <MenuItem selected>Reports</MenuItem>
        <MenuItem>Notifications</MenuItem>
        <MenuItem>History</MenuItem>
      </Menu>
    </ExampleFrame>
  );
}

function ReorderingExample() {
  const [open, setOpen] = React.useState(false);
  const [priorityFirst, setPriorityFirst] = React.useState(true);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  const priorityGroup = (
    <React.Fragment key="priority-group">
      <MenuItem>Pin to left</MenuItem>
      <MenuItem>Pin to right</MenuItem>
    </React.Fragment>
  );

  const primaryGroup = (
    <React.Fragment key="primary-group">
      <MenuItem>Rename</MenuItem>
      <MenuItem selected>Duplicate</MenuItem>
      <MenuItem>Archive</MenuItem>
    </React.Fragment>
  );

  const orderedGroups = priorityFirst
    ? [priorityGroup, <MenuDivider key="boundary-divider" />, primaryGroup]
    : [primaryGroup, <MenuDivider key="boundary-divider" />, priorityGroup];

  return (
    <ExampleFrame
      eyebrow="Internal Reordering"
      title="Moving a whole fragment block to a different position"
      description="This example moves an entire keyed fragment from the top of the menu to the bottom while the menu is already open."
      instructions='Open the menu and move the priority fragment. Focus should stay on "Duplicate" even as the block moves around it.'
    >
      <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button ref={buttonRef} variant="contained" onClick={() => setOpen(true)}>
          Open reordering menu
        </Button>
        <Button variant="outlined" onClick={() => setPriorityFirst((previous) => !previous)}>
          {priorityFirst ? 'Move priority actions below' : 'Move priority actions above'}
        </Button>
      </Stack>
      <Menu anchorEl={buttonRef.current} open={open} onClose={() => setOpen(false)}>
        {orderedGroups}
      </Menu>
    </ExampleFrame>
  );
}

export default function RovingFocusExperiment() {
  return (
    <React.Fragment>
      <Head title="Menu Roving Focus Experiments" description="" />
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Container maxWidth="md">
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="overline" color="text.secondary">
                Experiments
              </Typography>
              <Typography variant="h3">
                Menu roving focus after registration-based item tracking
              </Typography>
              <Typography variant="body1" color="text.secondary">
                These demos focus on the cases that were brittle before the refactor: MenuItems
                inside fragments, wrapped dividers, and conditional child trees that reorder after
                the menu has already resolved its active item.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button component={Link} href="/experiments" noLinkStyle variant="outlined">
                  Back to experiments
                </Button>
                <Button
                  component={Link}
                  href="https://github.com/mui/material-ui/tree/master/docs/pages/experiments"
                  noLinkStyle
                  variant="text"
                >
                  Open experiments source
                </Button>
              </Box>
            </Stack>
            <FragmentAndDividerExample />
            <ConditionalInsertExample />
            <ReorderingExample />
          </Stack>
        </Container>
      </Box>
    </React.Fragment>
  );
}
