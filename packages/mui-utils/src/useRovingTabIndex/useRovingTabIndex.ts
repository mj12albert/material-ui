'use client';

import * as React from 'react';

import ownerDocument from '../ownerDocument';
import getActiveElement from '../getActiveElement';
import setRef from '../setRef';
import useEnhancedEffect from '../useEnhancedEffect';
import useEventCallback from '../useEventCallback';
import useForkRef from '../useForkRef';

export interface RovingTabIndexItem<Key = unknown> {
  id: Key;
  ref?: React.Ref<HTMLElement> | undefined;
  disabled?: boolean | undefined;
  focusableWhenDisabled?: boolean | undefined;
  textValue?: string | undefined;
  selected?: boolean | undefined;
}

export interface RegisteredRovingTabIndexItem<Key = unknown> {
  id: Key;
  element: HTMLElement | null;
  disabled: boolean;
  focusableWhenDisabled: boolean;
  textValue?: string | undefined;
  selected: boolean;
}

export interface UseRovingTabIndexOptions<Key = unknown> {
  activeItemId?: Key | null | undefined;
  getDefaultActiveItemId?: ((items: RegisteredRovingTabIndexItem<Key>[]) => Key | null) | undefined;
  orientation: 'horizontal' | 'vertical';
  isRtl?: boolean | undefined;
  isItemFocusable?: ((item: RegisteredRovingTabIndexItem<Key>) => boolean) | undefined;
  shouldWrap?: boolean | undefined;
}

export interface UseRovingTabIndexRootReturn<Key = unknown> {
  activeItemId: Key | null;
  focusActiveItem: () => Key | null;
  focusNext: (
    isItemFocusableOverride?: (item: RegisteredRovingTabIndexItem<Key>) => boolean,
  ) => Key | null;
  getActiveItem: () => RegisteredRovingTabIndexItem<Key> | null;
  getContainerProps: (ref?: React.Ref<HTMLElement>) => {
    onFocus: (event: React.FocusEvent<HTMLElement>) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
    ref: (element: HTMLElement | null) => void;
  };
  getItemMap: () => Map<Key, RegisteredRovingTabIndexItem<Key>>;
  isItemActive: (itemId: Key) => boolean;
  registerItem: (item: RegisteredRovingTabIndexItem<Key>) => void;
  setActiveItemId: (itemId: Key | null) => void;
  unregisterItem: (itemId: Key) => void;
}

interface UseRovingTabIndexReturn<Key = unknown> {
  activeItemId: Key | null;
  getActiveItem: () => RegisteredRovingTabIndexItem<Key> | null;
  getItemMap: () => Map<Key, RegisteredRovingTabIndexItem<Key>>;
  getItemProps: (item: RovingTabIndexItem<Key>) => {
    ref: (element: HTMLElement | null) => void;
    tabIndex: number;
  };
  getContainerProps: (ref?: React.Ref<HTMLElement>) => {
    onFocus: (event: React.FocusEvent<HTMLElement>) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
    ref: (element: HTMLElement | null) => void;
  };
  focusNext: (
    isItemFocusableOverride?: (item: RegisteredRovingTabIndexItem<Key>) => boolean,
  ) => Key | null;
}

export interface UseRovingTabIndexItemReturn {
  onFocus: (event: React.FocusEvent<HTMLElement>) => void;
  ref: React.RefCallback<HTMLElement | null>;
  tabIndex: number;
}

const SUPPORTED_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

type RovingTabIndexContextValue = UseRovingTabIndexRootReturn<unknown>;

export interface RovingTabIndexProviderProps<Key = unknown> {
  children?: React.ReactNode;
  value: UseRovingTabIndexRootReturn<Key> | null;
}

export const RovingTabIndexContext = React.createContext<RovingTabIndexContextValue | null>(null);

if (process.env.NODE_ENV !== 'production') {
  RovingTabIndexContext.displayName = 'RovingTabIndexContext';
}

export function RovingTabIndexProvider<Key = unknown>(props: RovingTabIndexProviderProps<Key>) {
  const { children, value } = props;

  return React.createElement(
    RovingTabIndexContext.Provider,
    {
      // The provider boundary erases the item id type; item hooks restore their local Key when reading it.
      value: value as RovingTabIndexContextValue | null,
    },
    children,
  );
}

/**
 * Provides roving tab index behavior for a composite container and its focusable children.
 * This is useful for implementing keyboard navigation in components like menus, tabs, and lists.
 * The hook manages the focus state of child elements and provides props to be spread on both the container and the items.
 * The container will handle keyboard events to move focus between items based on the specified orientation and wrapping behavior.
 *
 * @param options Configuration for the roving set.
 * `activeItemId` synchronizes the active item when its value changes.
 * `getDefaultActiveItemId` picks the fallback active item when there is no requested item.
 * `isItemFocusable` filters registered items out of keyboard navigation without removing them from the map.
 * @returns An object containing:
 * - `activeItemId`: the resolved active item id for the current render.
 * - `getActiveItem`: a getter for the current active item record.
 * - `getItemMap`: a getter for the registered item map.
 * - `getItemProps`: item props that opt an element into the roving set.
 * - `getContainerProps`: container props that enable roving keyboard handling.
 * - `focusNext`: an imperative helper that moves focus to the next matching item.
 */
export function useRovingTabIndexRoot<Key = unknown>(
  options: UseRovingTabIndexOptions<Key>,
): UseRovingTabIndexRootReturn<Key> {
  const {
    activeItemId: activeItemIdProp,
    getDefaultActiveItemId,
    orientation,
    isRtl = false,
    isItemFocusable = isRovingTabIndexItemFocusable,
    shouldWrap = true,
  } = options;

  const [activeItemIdState, setActiveItemIdState] = React.useState<Key | null | undefined>(
    activeItemIdProp,
  );

  const previousActiveItemIdPropRef = React.useRef<Key | null | undefined>(activeItemIdProp);
  let activeItemIdCandidate = activeItemIdState;

  if (activeItemIdProp !== previousActiveItemIdPropRef.current) {
    previousActiveItemIdPropRef.current = activeItemIdProp;

    if (activeItemIdProp !== undefined && activeItemIdProp !== activeItemIdState) {
      activeItemIdCandidate = activeItemIdProp;
      setActiveItemIdState(activeItemIdProp);
    }
  }

  const itemMapRef = React.useRef<Map<Key, RegisteredRovingTabIndexItem<Key>>>(new Map());
  const navigableItemsRef = React.useRef<RegisteredRovingTabIndexItem<Key>[]>([]);
  const containerRef = React.useRef<HTMLElement | null>(null);
  const [mapTick, setMapTick] = React.useState(0);

  // `mapTick` is only an invalidation signal. The source of truth stays in the stable item map.
  const orderedItems = React.useMemo(() => {
    void mapTick;
    return getOrderedItems(itemMapRef.current);
  }, [mapTick]);

  const navigableItems = React.useMemo(() => {
    return orderedItems.filter(isConnectedItem);
  }, [orderedItems]);
  navigableItemsRef.current = navigableItems;

  const resolvedActiveItemId = resolveActiveItemId({
    activeItemId: activeItemIdCandidate,
    items: orderedItems,
    isItemFocusable,
    getDefaultActiveItemId,
  });

  const activeItemIdRef = React.useRef<Key | null>(resolvedActiveItemId);
  activeItemIdRef.current = resolvedActiveItemId;

  const getNavigableItemsSnapshot = React.useCallback(() => {
    const liveNavigableItems = getOrderedItems(itemMapRef.current).filter(isConnectedItem);
    navigableItemsRef.current = liveNavigableItems;

    return liveNavigableItems;
  }, []);

  const getActiveItem = React.useCallback(() => {
    const liveOrderedItems = getOrderedItems(itemMapRef.current);
    const liveActiveItemId = resolveActiveItemId({
      activeItemId: activeItemIdRef.current,
      items: liveOrderedItems,
      isItemFocusable,
      getDefaultActiveItemId,
    });

    return getItemById(liveOrderedItems, liveActiveItemId);
  }, [getDefaultActiveItemId, isItemFocusable]);

  const getItemMap = React.useCallback(() => {
    return itemMapRef.current;
  }, []);

  const registerItem = useEventCallback((item: RegisteredRovingTabIndexItem<Key>) => {
    const previousItem = itemMapRef.current.get(item.id);

    if (areItemsEquivalent(previousItem, item)) {
      return;
    }

    itemMapRef.current.set(item.id, item);
    setMapTick((value) => value + 1);
  });

  const unregisterItem = useEventCallback((itemId: Key) => {
    if (itemMapRef.current.delete(itemId)) {
      setMapTick((value) => value + 1);
    }
  });

  const setActiveItemId = useEventCallback((itemId: Key | null) => {
    setActiveItemIdState(itemId);
  });

  const isItemActive = React.useCallback((itemId: Key) => {
    return activeItemIdRef.current === itemId;
  }, []);

  const focusItem = React.useCallback(
    (
      currentIndex: number,
      direction: 'next' | 'previous',
      wrap: boolean,
      isItemFocusableOverride?: (item: RegisteredRovingTabIndexItem<Key>) => boolean,
    ) => {
      const navigableItemsSnapshot = getNavigableItemsSnapshot();
      const nextItem = getNextActiveItem(
        navigableItemsSnapshot,
        currentIndex,
        direction,
        wrap,
        isItemFocusableOverride ?? isItemFocusable,
      );

      if (!nextItem) {
        return null;
      }

      nextItem.element?.focus();
      setActiveItemIdState(nextItem.id);

      return nextItem;
    },
    [getNavigableItemsSnapshot, isItemFocusable],
  );

  const focusActiveItem = React.useCallback(() => {
    const activeItem = getActiveItem();

    if (!activeItem?.element) {
      return null;
    }

    activeItem.element.focus();
    setActiveItemIdState(activeItem.id);

    return activeItem.id;
  }, [getActiveItem]);

  const getContainerProps = React.useCallback(
    (ref?: React.Ref<HTMLElement>) => {
      const onFocus = (event: React.FocusEvent<HTMLElement>) => {
        const focusedIndex = findItemIndexByElement(
          getNavigableItemsSnapshot(),
          event.target as HTMLElement,
        );

        if (focusedIndex !== -1) {
          setActiveItemIdState(navigableItemsRef.current[focusedIndex].id);
        }
      };

      const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
          return;
        }

        if (!SUPPORTED_KEYS.includes(event.key)) {
          return;
        }

        let previousItemKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
        let nextItemKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

        if (orientation === 'horizontal' && isRtl) {
          previousItemKey = 'ArrowRight';
          nextItemKey = 'ArrowLeft';
        }

        const navigableItemsSnapshot = getNavigableItemsSnapshot();
        const currentFocus = getActiveElement(ownerDocument(containerRef.current));
        const isFocusOnContainer = currentFocus === containerRef.current;
        let currentIndex = getCurrentActiveItemIndex(
          navigableItemsSnapshot,
          currentFocus,
          activeItemIdRef.current,
        );
        let direction: 'next' | 'previous' = 'next';

        switch (event.key) {
          case previousItemKey:
            direction = 'previous';
            event.preventDefault();

            if (isFocusOnContainer) {
              currentIndex = navigableItemsSnapshot.length;
            }
            break;
          case nextItemKey:
            event.preventDefault();

            if (isFocusOnContainer) {
              currentIndex = -1;
            }
            break;
          case 'Home':
            event.preventDefault();
            currentIndex = -1;
            break;
          case 'End':
            event.preventDefault();
            direction = 'previous';
            currentIndex = navigableItemsSnapshot.length;
            break;
          default:
            return;
        }

        focusItem(currentIndex, direction, shouldWrap);
      };

      return {
        onFocus,
        onKeyDown,
        ref: handleRefs(ref, (elementNode) => {
          containerRef.current = elementNode;
        }),
      };
    },
    [focusItem, getNavigableItemsSnapshot, isRtl, orientation, shouldWrap],
  );

  const focusNext = React.useCallback(
    (isItemFocusableOverride?: (item: RegisteredRovingTabIndexItem<Key>) => boolean) => {
      const navigableItemsSnapshot = getNavigableItemsSnapshot();
      const currentFocus = getActiveElement(ownerDocument(containerRef.current));
      const isFocusOnContainer = currentFocus === containerRef.current;
      const currentIndex = isFocusOnContainer
        ? -1
        : getCurrentActiveItemIndex(navigableItemsSnapshot, currentFocus, activeItemIdRef.current);

      return focusItem(currentIndex, 'next', true, isItemFocusableOverride)?.id ?? null;
    },
    [focusItem, getNavigableItemsSnapshot],
  );

  return React.useMemo(
    () => ({
      activeItemId: resolvedActiveItemId,
      focusActiveItem,
      focusNext,
      getActiveItem,
      getContainerProps,
      getItemMap,
      isItemActive,
      registerItem,
      setActiveItemId,
      unregisterItem,
    }),
    [
      resolvedActiveItemId,
      focusActiveItem,
      focusNext,
      getActiveItem,
      getContainerProps,
      getItemMap,
      isItemActive,
      registerItem,
      setActiveItemId,
      unregisterItem,
    ],
  );
}

export function useRovingTabIndexItem<Key = unknown>(
  item: RovingTabIndexItem<Key>,
  rootParam?: UseRovingTabIndexRootReturn<Key> | null,
): UseRovingTabIndexItemReturn {
  const rootFromContext = React.useContext(RovingTabIndexContext);
  const itemRef = React.useRef<HTMLElement | null>(null);
  const normalizedItem = React.useMemo(
    () => ({
      disabled: item.disabled ?? false,
      element: null,
      focusableWhenDisabled: item.focusableWhenDisabled ?? false,
      id: item.id,
      ref: item.ref,
      selected: item.selected ?? false,
      textValue: item.textValue,
    }),
    [item.disabled, item.focusableWhenDisabled, item.id, item.ref, item.selected, item.textValue],
  );
  const normalizedItemRef = React.useRef(normalizedItem);
  normalizedItemRef.current = normalizedItem;
  const registerItem = React.useCallback(
    (registeredItem: RegisteredRovingTabIndexItem<Key>) => {
      if (rootParam != null) {
        rootParam.registerItem(registeredItem);
        return;
      }

      rootFromContext?.registerItem(registeredItem);
    },
    [rootFromContext, rootParam],
  );
  const unregisterItem = React.useCallback(
    (itemId: Key) => {
      if (rootParam != null) {
        rootParam.unregisterItem(itemId);
        return;
      }

      rootFromContext?.unregisterItem(itemId);
    },
    [rootFromContext, rootParam],
  );
  const setActiveItemId = React.useCallback(
    (itemId: Key | null) => {
      if (rootParam != null) {
        rootParam.setActiveItemId(itemId);
        return;
      }

      rootFromContext?.setActiveItemId(itemId);
    },
    [rootFromContext, rootParam],
  );
  const isItemActive = React.useCallback(
    (itemId: Key) => {
      if (rootParam != null) {
        return rootParam.isItemActive(itemId);
      }

      return rootFromContext?.isItemActive(itemId) ?? false;
    },
    [rootFromContext, rootParam],
  );

  const handleNodeChange = React.useCallback(
    (elementNode: HTMLElement | null) => {
      itemRef.current = elementNode;

      if (elementNode === null) {
        // The focusable element can disappear while the hook owner stays mounted,
        // so ref cleanup must eagerly unregister it. The effect cleanup below only
        // covers hook teardown and item id changes.
        unregisterItem(item.id);
        return;
      }

      registerItem({
        ...normalizedItemRef.current,
        element: elementNode,
      });
    },
    [item.id, registerItem, unregisterItem],
  );

  // `UseRovingTabIndexItemReturn.ref` is always a callback ref. `useForkRef()` only returns
  // `null` when every input ref is `null`/`undefined`, but this call always includes
  // `handleNodeChange`, so the merged ref callback is guaranteed to exist.
  const handleRef = useForkRef(item.ref, handleNodeChange)!;

  useEnhancedEffect(() => {
    if (!itemRef.current) {
      return;
    }

    registerItem({
      ...normalizedItemRef.current,
      element: itemRef.current,
    });
  }, [
    normalizedItem.disabled,
    normalizedItem.focusableWhenDisabled,
    normalizedItem.id,
    normalizedItem.selected,
    normalizedItem.textValue,
    registerItem,
  ]);

  useEnhancedEffect(() => {
    const itemId = item.id;

    return () => {
      unregisterItem(itemId);
    };
  }, [item.id, unregisterItem]);

  const onFocus = React.useCallback(
    (_event: React.FocusEvent<HTMLElement>) => {
      setActiveItemId(item.id);
    },
    [item.id, setActiveItemId],
  );

  return {
    onFocus,
    ref: handleRef,
    tabIndex: isItemActive(item.id) ? 0 : -1,
  };
}

export default function useRovingTabIndex<Key = unknown>(
  options: UseRovingTabIndexOptions<Key>,
): UseRovingTabIndexReturn<Key> {
  const rovingRoot = useRovingTabIndexRoot(options);
  const {
    activeItemId,
    getActiveItem,
    getContainerProps,
    getItemMap,
    focusNext,
    registerItem,
    unregisterItem,
  } = rovingRoot;
  const requestedActiveItemIdForInitialTabStop =
    options.activeItemId === undefined || options.activeItemId === null
      ? null
      : options.activeItemId;
  const itemExternalRefsRef = React.useRef<Map<Key, React.Ref<HTMLElement> | undefined>>(new Map());
  const itemRefCallbacksRef = React.useRef<Map<Key, (element: HTMLElement | null) => void>>(
    new Map(),
  );
  const renderedItemIdsRef = React.useRef<Set<Key>>(new Set());
  renderedItemIdsRef.current = new Set();

  useEnhancedEffect(() => {
    getItemMap().forEach((_, itemId) => {
      if (!renderedItemIdsRef.current.has(itemId)) {
        unregisterItem(itemId);
        itemExternalRefsRef.current.delete(itemId);
        itemRefCallbacksRef.current.delete(itemId);
      }
    });
  });

  const getItemProps = React.useCallback(
    (item: RovingTabIndexItem<Key>) => {
      const normalizedItem = normalizeItem(item);
      const previousItem = getItemMap().get(normalizedItem.id);

      // Parent-owned consumers (for example, Tabs) call `getItemProps()` during render.
      // Registration intentionally converges in at most one extra render because
      // `areItemsEquivalent()` short-circuits once the item map matches this render's item.
      renderedItemIdsRef.current.add(normalizedItem.id);
      itemExternalRefsRef.current.set(normalizedItem.id, normalizedItem.ref);

      if (!areItemsEquivalent(previousItem, normalizedItem)) {
        registerItem({
          ...normalizedItem,
          element: previousItem?.element ?? null,
        });
      }

      let itemRefCallback = itemRefCallbacksRef.current.get(normalizedItem.id);

      if (!itemRefCallback) {
        itemRefCallback = (elementNode) => {
          const externalRef = itemExternalRefsRef.current.get(normalizedItem.id);

          if (elementNode === null) {
            unregisterItem(normalizedItem.id);
            setRef(externalRef ?? null, elementNode);
            return;
          }

          const latestItem = getItemMap().get(normalizedItem.id) ?? normalizedItem;
          registerItem({
            ...latestItem,
            element: elementNode,
          });

          setRef(externalRef ?? null, elementNode);
        };

        itemRefCallbacksRef.current.set(normalizedItem.id, itemRefCallback);
      }

      return {
        ref: itemRefCallback,
        tabIndex:
          normalizedItem.id === (activeItemId ?? requestedActiveItemIdForInitialTabStop) ? 0 : -1,
      };
    },
    [
      activeItemId,
      getItemMap,
      registerItem,
      requestedActiveItemIdForInitialTabStop,
      unregisterItem,
    ],
  );

  return {
    activeItemId,
    getActiveItem,
    getContainerProps,
    getItemMap,
    getItemProps,
    focusNext,
  };
}

function resolveActiveItemId<Key>({
  activeItemId,
  items,
  isItemFocusable,
  getDefaultActiveItemId,
}: {
  activeItemId: Key | null | undefined;
  items: RegisteredRovingTabIndexItem<Key>[];
  isItemFocusable: (item: RegisteredRovingTabIndexItem<Key>) => boolean;
  getDefaultActiveItemId?: ((items: RegisteredRovingTabIndexItem<Key>[]) => Key | null) | undefined;
}): Key | null {
  if (activeItemId !== undefined && activeItemId !== null) {
    return resolveRequestedItemId(activeItemId, items, isItemFocusable);
  }

  return resolveDefaultItemId(items, isItemFocusable, getDefaultActiveItemId);
}

function resolveRequestedItemId<Key>(
  requestedItemId: Key,
  items: RegisteredRovingTabIndexItem<Key>[],
  isItemFocusable: (item: RegisteredRovingTabIndexItem<Key>) => boolean,
): Key | null {
  const requestedItemIndex = findItemIndexById(items, requestedItemId);

  if (requestedItemIndex === -1) {
    return getFirstFocusableItemId(items, isItemFocusable);
  }

  if (isItemFocusable(items[requestedItemIndex])) {
    return items[requestedItemIndex].id;
  }

  return getNextActiveItem(items, requestedItemIndex, 'next', false, isItemFocusable)?.id ?? null;
}

function resolveDefaultItemId<Key>(
  items: RegisteredRovingTabIndexItem<Key>[],
  isItemFocusable: (item: RegisteredRovingTabIndexItem<Key>) => boolean,
  getDefaultActiveItemId?: ((items: RegisteredRovingTabIndexItem<Key>[]) => Key | null) | undefined,
): Key | null {
  const defaultItemId = getDefaultActiveItemId?.(items);

  if (defaultItemId !== null && defaultItemId !== undefined) {
    const defaultItem = getItemById(items, defaultItemId);

    if (defaultItem && isItemFocusable(defaultItem)) {
      return defaultItem.id;
    }
  }

  return getFirstFocusableItemId(items, isItemFocusable);
}

function getCurrentActiveItemIndex<Key>(
  items: RegisteredRovingTabIndexItem<Key>[],
  currentFocus: Element | null,
  fallbackActiveItemId: Key | null,
) {
  if (currentFocus) {
    const focusedIndex = findItemIndexByElement(items, currentFocus);

    if (focusedIndex !== -1) {
      return focusedIndex;
    }
  }

  return findItemIndexById(items, fallbackActiveItemId);
}

function getNextActiveItem<Key>(
  items: RegisteredRovingTabIndexItem<Key>[],
  currentIndex: number,
  direction: 'next' | 'previous',
  wrap: boolean,
  isItemFocusable: (item: RegisteredRovingTabIndexItem<Key>) => boolean,
) {
  const lastIndex = items.length - 1;

  if (lastIndex === -1) {
    return null;
  }
  let wrappedOnce = false;
  let nextIndex = getNextIndex(currentIndex, lastIndex, direction, wrap);
  const startIndex = nextIndex;

  while (nextIndex !== -1) {
    if (nextIndex === startIndex) {
      if (wrappedOnce) {
        return null;
      }
      wrappedOnce = true;
    }

    const nextItem = items[nextIndex];

    if (!nextItem || !isItemFocusable(nextItem)) {
      nextIndex = getNextIndex(nextIndex, lastIndex, direction, wrap);
    } else {
      return nextItem;
    }
  }

  return null;
}

function getFirstFocusableItemId<Key>(
  items: RegisteredRovingTabIndexItem<Key>[],
  isItemFocusable: (item: RegisteredRovingTabIndexItem<Key>) => boolean,
): Key | null {
  return items.find((item) => isItemFocusable(item))?.id ?? null;
}

function getItemById<Key>(items: RegisteredRovingTabIndexItem<Key>[], itemId: Key | null) {
  return itemId === null ? null : (items.find((item) => item.id === itemId) ?? null);
}

function findItemIndexById<Key>(items: RegisteredRovingTabIndexItem<Key>[], itemId: Key | null) {
  return itemId === null ? -1 : items.findIndex((item) => item.id === itemId);
}

function findItemIndexByElement<Key>(
  items: RegisteredRovingTabIndexItem<Key>[],
  element: Element | null,
) {
  if (!element) {
    return -1;
  }

  return items.findIndex((item) => item.element === element || item.element?.contains(element));
}

function getOrderedItems<Key>(itemMap: Map<Key, RegisteredRovingTabIndexItem<Key>>) {
  const items = Array.from(itemMap.values());

  if (items.every((item) => item.element === null)) {
    return items;
  }

  const connectedItems = items
    .filter(isConnectedItem)
    .sort((itemA, itemB) => sortByDocumentPosition(itemA.element, itemB.element));
  const disconnectedItems = items.filter((item) => !isConnectedItem(item));

  return [...connectedItems, ...disconnectedItems];
}

function normalizeItem<Key>(item: RovingTabIndexItem<Key>): RegisteredRovingTabIndexItem<Key> & {
  ref?: React.Ref<HTMLElement> | undefined;
} {
  return {
    id: item.id,
    ref: item.ref,
    element: null,
    disabled: item.disabled ?? false,
    focusableWhenDisabled: item.focusableWhenDisabled ?? false,
    textValue: item.textValue,
    selected: item.selected ?? false,
  };
}

function areItemsEquivalent<Key>(
  previousItem: RegisteredRovingTabIndexItem<Key> | undefined,
  nextItem: RegisteredRovingTabIndexItem<Key>,
) {
  if (!previousItem) {
    return false;
  }

  return (
    previousItem.id === nextItem.id &&
    previousItem.element === nextItem.element &&
    previousItem.disabled === nextItem.disabled &&
    previousItem.focusableWhenDisabled === nextItem.focusableWhenDisabled &&
    previousItem.selected === nextItem.selected &&
    previousItem.textValue === nextItem.textValue
  );
}

function getNextIndex(
  currentIndex: number,
  lastIndex: number,
  direction: 'next' | 'previous',
  wrap: boolean = true,
): number {
  if (direction === 'next') {
    if (currentIndex === lastIndex) {
      return wrap ? 0 : -1;
    }

    return currentIndex + 1;
  }

  if (currentIndex === 0) {
    return wrap ? lastIndex : -1;
  }

  return currentIndex - 1;
}

export function isRovingTabIndexItemFocusable<Key>(item: RegisteredRovingTabIndexItem<Key>) {
  if (!item.element) {
    return false;
  }

  if (item.focusableWhenDisabled) {
    return true;
  }

  return (
    !item.disabled &&
    !item.element.hasAttribute('disabled') &&
    item.element.getAttribute('aria-disabled') !== 'true'
  );
}

function isConnectedItem<Key>(
  item: RegisteredRovingTabIndexItem<Key>,
): item is RegisteredRovingTabIndexItem<Key> & { element: HTMLElement } {
  return item.element !== null && item.element.isConnected;
}

/* eslint-disable no-bitwise */
function sortByDocumentPosition(a: Element, b: Element) {
  if (a === b) {
    return 0;
  }

  const position = a.compareDocumentPosition(b);

  if (
    position & Node.DOCUMENT_POSITION_FOLLOWING ||
    position & Node.DOCUMENT_POSITION_CONTAINED_BY
  ) {
    return -1;
  }

  if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
    return 1;
  }

  return 0;
}
/* eslint-enable no-bitwise */

function handleRefs(...refs: (React.Ref<HTMLElement> | undefined)[]) {
  return (node: HTMLElement | null) => {
    refs.forEach((ref) => {
      setRef(ref ?? null, node);
    });
  };
}
