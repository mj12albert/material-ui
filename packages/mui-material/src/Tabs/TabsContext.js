'use client';
import * as React from 'react';

/**
 * @ignore - internal component.
 */
const TabsContext = React.createContext(null);

if (process.env.NODE_ENV !== 'production') {
  TabsContext.displayName = 'TabsContext';
}

export default TabsContext;
