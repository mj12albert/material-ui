import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import FaceIcon from '@mui/icons-material/Face';
import DeleteIcon from '@mui/icons-material/Delete';
import ChipButton from './components/ChipButton';
import ChipLink from './components/ChipLink';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {children}
      </Box>
    </Box>
  );
}

export default function ChipDemo() {
  const [chips, setChips] = React.useState(['Deletable 1', 'Deletable 2', 'Deletable 3']);
  const handleDelete = (chipToDelete: string) => () => {
    setChips((prev) => prev.filter((chip) => chip !== chipToDelete));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Chip Recipe
      </Typography>

      {/* -- ChipButton variants -- */}
      <Section title="ChipButton — Filled">
        <ChipButton label="Default" onClick={() => {}} />
        <ChipButton label="Primary" color="primary" onClick={() => {}} />
        <ChipButton label="Secondary" color="secondary" onClick={() => {}} />
        <ChipButton label="Error" color="error" onClick={() => {}} />
        <ChipButton label="Success" color="success" onClick={() => {}} />
        <ChipButton label="Info" color="info" onClick={() => {}} />
        <ChipButton label="Warning" color="warning" onClick={() => {}} />
      </Section>

      <Section title="ChipButton — Outlined">
        <ChipButton label="Default" variant="outlined" onClick={() => {}} />
        <ChipButton label="Primary" variant="outlined" color="primary" onClick={() => {}} />
        <ChipButton label="Secondary" variant="outlined" color="secondary" onClick={() => {}} />
        <ChipButton label="Error" variant="outlined" color="error" onClick={() => {}} />
      </Section>

      <Section title="ChipButton — Sizes">
        <ChipButton label="Small" size="small" onClick={() => {}} />
        <ChipButton label="Medium" onClick={() => {}} />
      </Section>

      {/* -- With icons and avatars -- */}
      <Section title="ChipButton — With icon">
        <ChipButton label="With icon" icon={<FaceIcon />} onClick={() => {}} />
        <ChipButton
          label="Small with icon"
          icon={<FaceIcon />}
          size="small"
          onClick={() => {}}
        />
      </Section>

      <Section title="ChipButton — With avatar">
        <ChipButton
          label="With avatar"
          avatar={<Avatar>M</Avatar>}
          onClick={() => {}}
        />
        <ChipButton
          label="Small with avatar"
          avatar={<Avatar alt="Test" src="/static/images/avatar/1.jpg" />}
          size="small"
          onClick={() => {}}
        />
      </Section>

      {/* -- With delete -- */}
      <Section title="ChipButton — With delete">
        <ChipButton
          label="Deletable"
          onDelete={() => {}}
          onClick={() => {}}
        />
        <ChipButton
          label="Custom delete icon"
          onDelete={() => {}}
          onClick={() => {}}
          deleteIcon={<DeleteIcon />}
        />
        <ChipButton
          label="Outlined deletable"
          variant="outlined"
          color="primary"
          onDelete={() => {}}
          onClick={() => {}}
        />
        <ChipButton
          label="Small deletable"
          size="small"
          onDelete={() => {}}
          onClick={() => {}}
        />
      </Section>

      <Section title="ChipButton — Delete only (no onClick)">
        <ChipButton label="Delete only" onDelete={() => {}} />
        <ChipButton
          label="With icon + delete"
          icon={<FaceIcon />}
          onDelete={() => {}}
        />
      </Section>

      {/* -- Disabled states -- */}
      <Section title="ChipButton — Disabled (focusableWhenDisabled=true, default)">
        <ChipButton label="Disabled" disabled onClick={() => {}} />
        <ChipButton
          label="Disabled with delete"
          disabled
          onDelete={() => {}}
          onClick={() => {}}
        />
        <ChipButton
          label="Disabled outlined"
          disabled
          variant="outlined"
          color="primary"
          onClick={() => {}}
        />
      </Section>

      <Section title="ChipButton — Disabled (focusableWhenDisabled=false)">
        <ChipButton
          label="Not focusable"
          disabled
          focusableWhenDisabled={false}
          onClick={() => {}}
        />
        <ChipButton
          label="Not focusable + delete"
          disabled
          focusableWhenDisabled={false}
          onDelete={() => {}}
          onClick={() => {}}
        />
      </Section>

      {/* -- ChipLink -- */}
      <Section title="ChipLink — Basic">
        <ChipLink label="Link chip" href="#chip-link" />
        <ChipLink label="Primary link" href="#chip-link" color="primary" />
        <ChipLink label="Outlined link" href="#chip-link" variant="outlined" />
        <ChipLink label="Small link" href="#chip-link" size="small" />
      </Section>

      <Section title="ChipLink — With icon">
        <ChipLink label="Link with icon" href="#chip-link" icon={<FaceIcon />} />
      </Section>

      <Section title="ChipLink — With delete">
        <ChipLink
          label="Deletable link"
          href="#chip-link"
          onDelete={() => {}}
        />
        <ChipLink
          label="Outlined deletable link"
          href="#chip-link"
          variant="outlined"
          color="primary"
          onDelete={() => {}}
        />
      </Section>

      {/* -- Live delete demo with aria-live -- */}
      <Section title="Live delete demo (with aria-live region)">
        <Box
          aria-live="polite"
          aria-atomic="false"
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
        >
          {chips.map((chip) => (
            <ChipButton
              key={chip}
              label={chip}
              onDelete={handleDelete(chip)}
              color="primary"
            />
          ))}
          {chips.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              All chips deleted.
            </Typography>
          )}
        </Box>
      </Section>
    </Box>
  );
}
