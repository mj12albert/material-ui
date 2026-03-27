'use client';
import * as React from 'react';

const MenuListContext = React.createContext(null);

if (process.env.NODE_ENV !== 'production') {
  MenuListContext.displayName = 'MenuListContext';
}

export default MenuListContext;
