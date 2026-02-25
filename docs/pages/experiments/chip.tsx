import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ChipDemo from 'docs/data/material/components/chip-recipe/ChipDemo';

const theme = createTheme();

export default function ChipExperiment() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChipDemo />
    </ThemeProvider>
  );
}
