'use client';

import * as React from 'react';

import ownerDocument from '../ownerDocument';
import getActiveElement from '../getActiveElement';
import setRef from '../setRef';
import useEnhancedEffect from '../useEnhancedEffect';
import useEventCallback from '../useEventCallback';
import useForkRef from '../useForkRef';
import { useRovingTabIndexContext } from './RovingTabIndexContext';

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

export interface UseRovingTabIndexRootParams<Key = unknown> {
  activeItemId?: Key | null | undefined;
  getDefaultActiveItemId?: ((items: RegisteredRovingTabIndexItem<Key>[]) => Key | null) | undefined;
  orientation: 'horizontal' | 'vertical';
  isRtl?: boolean | undefined;
  isItemFocusable?: ((item: RegisteredRovingTabIndexItem<Key>) => boolean) | undefined;
  shouldWrap?: boolean | undefined;
}

export interface UseRovingTabIndexRootReturnValue<Key = unknown> {
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

export interface UseRovingTabIndexItemParams<Key = unknown> extends RovingTabIndexItem<Key> {}

export interface UseRovingTabIndexItemReturnValue {
  ref: React.RefCallback<HTMLElement | null>;
  tabIndex: number;
}

const SUPPORTED_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

/**
 * Provides roving tab index behavior for a composite container and its focusable children.
 * This is useful for implementing keyboard navigation in components like menus, tabs, and lists.
 * The hook manages the focus state of child elements and provides props to be spread on both the container and the items.
 * The container will handle keyboard events to move focus between items based on the specified orientation and wrapping behavior.
 *
 * @param params Configuration for the roving set.
 * `activeItemId` synchronizes the active item when its value changes.
 * `getDefaultActiveItemId` picks the fallback active item when there is no requested item.
 * `isItemFocusable` filters registered items out of keyboard navigation without removing them from the map.
 * @returns An object containing:
 * - `activeItemId`: the resolved active item id for the current render.
 * - `focusActiveItem`: an imperative helper that focuses the current active item.
 * - `focusNext`: an imperative helper that moves focus to the next matching item.
 * - `getActiveItem`: a getter for the current active item record.
 * - `getContainerProps`: container props that enable roving keyboard handling.
 * - `getItemMap`: a getter for the registered item map.
 * - `isItemActive`: a predicate that reports whether an item id currently owns the tab stop.
 * - `registerItem`: registers or updates an item in the roving set.
 * - `setActiveItemId`: updates the current active item id.
 * - `unregisterItem`: removes an item from the roving set.
 */
export function useRovingTabIndexRoot<Key = unknown>(
  params: UseRovingTabIndexRootParams<Key>,
): UseRovingTabIndexRootReturnValue<Key> {
  const {
    activeItemId: activeItemIdProp,
    getDefaultActiveItemId,
    orientation,
    isRtl = false,
    isItemFocusable = isRovingTabIndexItemFocusable,
    shouldWrap = true,
  } = params;

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

  const containerRef = React.useRef<HTMLElement | null>(null);

  // based on https://github.com/mui/base-ui/blob/7392a928fca91fcc68b9fad3439ac61e10f3f7ba/packages/react/src/composite/list/CompositeList.tsx#L25-L35
  const itemMapRef = React.useRef<Map<Key, RegisteredRovingTabIndexItem<Key>>>(new Map());
  // `mapTick` is a trigger used to invalidate the memo, forcing a re-render when the map changes
  const [mapTick, setMapTick] = React.useState(0);
  const orderedItems = React.useMemo(() => {
    void mapTick;
    return getOrderedItems(itemMapRef.current);
  }, [mapTick]);

  const resolvedActiveItemId = resolveActiveItemId({
    activeItemId: activeItemIdCandidate,
    items: orderedItems,
    isItemFocusable,
    getDefaultActiveItemId,
  });

  const activeItemIdRef = React.useRef<Key | null>(resolvedActiveItemId);
  activeItemIdRef.current = resolvedActiveItemId;

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
      const navigableItemsSnapshot = getNavigableItemsSnapshot(itemMapRef.current);
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
    [isItemFocusable],
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
        const navigableItemsSnapshot = getNavigableItemsSnapshot(itemMapRef.current);
        const focusedIndex = findItemIndexByElement(navigableItemsSnapshot, event.target);

        if (focusedIndex !== -1) {
          setActiveItemIdState(navigableItemsSnapshot[focusedIndex].id);
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

        const navigableItemsSnapshot = getNavigableItemsSnapshot(itemMapRef.current);
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
    [focusItem, isRtl, orientation, shouldWrap],
  );

  const focusNext = React.useCallback(
    (isItemFocusableOverride?: (item: RegisteredRovingTabIndexItem<Key>) => boolean) => {
      const navigableItemsSnapshot = getNavigableItemsSnapshot(itemMapRef.current);
      const currentFocus = getActiveElement(ownerDocument(containerRef.current));
      const isFocusOnContainer = currentFocus === containerRef.current;
      const currentIndex = isFocusOnContainer
        ? -1
        : getCurrentActiveItemIndex(navigableItemsSnapshot, currentFocus, activeItemIdRef.current);

      return focusItem(currentIndex, 'next', true, isItemFocusableOverride)?.id ?? null;
    },
    [focusItem],
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
  params: UseRovingTabIndexItemParams<Key>,
): UseRovingTabIndexItemReturnValue {
  const rootFromContext = useRovingTabIndexContext();
  const { activeItemId, registerItem, unregisterItem } = rootFromContext;
  const itemRef = React.useRef<HTMLElement | null>(null);
  const normalizedItem = React.useMemo(
    () => ({
      disabled: params.disabled ?? false,
      element: null,
      focusableWhenDisabled: params.focusableWhenDisabled ?? false,
      id: params.id,
      selected: params.selected ?? false,
      textValue: params.textValue,
    }),
    [params.disabled, params.focusableWhenDisabled, params.id, params.selected, params.textValue],
  );
  const normalizedItemRef = React.useRef(normalizedItem);
  normalizedItemRef.current = normalizedItem;

  const handleNodeChange = React.useCallback(
    (elementNode: HTMLElement | null) => {
      itemRef.current = elementNode;

      if (elementNode == null) {
        // Ref detachment runs during React's commit phase. Calling `unregisterItem()`
        // synchronously here can trigger a nested state update while React is still
        // finishing that commit. Unregister in a microtask so it runs after the
        // commit completes.
        queueMicrotask(() => {
          // null check prevents stale unregisters for a remove-then-re-add edge case
          if (itemRef.current == null) {
            unregisterItem(params.id);
          }
        });
        return;
      }

      registerItem({
        ...normalizedItemRef.current,
        element: elementNode,
      });
    },
    [params.id, registerItem, unregisterItem],
  );

  // `UseRovingTabIndexItemReturnValue.ref` is always a callback ref. `useForkRef()` only returns
  // `null` when every input ref is `null`/`undefined`, but this call always includes
  // `handleNodeChange`, so the merged ref callback is guaranteed to exist.
  const handleRef = useForkRef(params.ref, handleNodeChange)!;

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
    const itemId = params.id;

    return () => {
      unregisterItem(itemId);
    };
  }, [params.id, unregisterItem]);

  return {
    ref: handleRef,
    tabIndex: activeItemId === params.id ? 0 : -1,
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

function getNavigableItemsSnapshot<Key>(itemMap: Map<Key, RegisteredRovingTabIndexItem<Key>>) {
  return getOrderedItems(itemMap).filter(isConnectedItem);
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
