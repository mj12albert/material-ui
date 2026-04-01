'use client';

import * as React from 'react';

import type { UseRovingTabIndexReturnValue } from './useRovingTabIndex';

type RovingTabIndexContextValue = UseRovingTabIndexReturnValue<unknown>;

export interface RovingTabIndexProviderProps<Key = unknown> {
  children?: React.ReactNode;
  value: UseRovingTabIndexReturnValue<Key>;
}

export const RovingTabIndexContext = React.createContext<RovingTabIndexContextValue | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  RovingTabIndexContext.displayName = 'RovingTabIndexContext';
}

export function RovingTabIndexProvider<Key = unknown>(props: RovingTabIndexProviderProps<Key>) {
  const { children, value } = props;

  return (
    <RovingTabIndexContext.Provider
      // The provider boundary erases the item id type; item hooks restore their local Key when reading it.
      value={value as RovingTabIndexContextValue}
    >
      {children}
    </RovingTabIndexContext.Provider>
  );
}

export function useRovingTabIndexContext() {
  const context = React.useContext(RovingTabIndexContext);

  if (context === undefined) {
    throw new Error(
      'MUI: RovingTabIndexContext is missing. Roving tab index items must be placed within a roving tab index provider.',
    );
  }

  return context;
}
