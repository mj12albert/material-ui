'use client';
import * as React from 'react';

const TabsContext = React.createContext(null);

if (process.env.NODE_ENV !== 'production') {
  TabsContext.displayName = 'TabsContext';
}

export default TabsContext;
