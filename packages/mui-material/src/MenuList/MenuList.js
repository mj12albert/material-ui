'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import ownerDocument from '../utils/ownerDocument';
import List from '../List';
import getActiveElement from '../utils/getActiveElement';
import getScrollbarSize from '../utils/getScrollbarSize';
import useForkRef from '../utils/useForkRef';
import useEnhancedEffect from '../utils/useEnhancedEffect';
import {
  isRovingTabIndexItemFocusable,
  RovingTabIndexProvider,
  useRovingTabIndexRoot,
} from '../utils/useRovingTabIndex';
import { ownerWindow } from '../utils';
import MenuListContext from './MenuListContext';

function getItemText(itemOrElement) {
  const element = itemOrElement?.element ?? itemOrElement;

  if (!element) {
    return '';
  }

  if (itemOrElement?.textValue !== undefined) {
    return itemOrElement.textValue;
  }

  let text = element.innerText;
  if (text === undefined) {
    // jsdom doesn't support innerText
    text = element.textContent;
  }

  return text ?? '';
}

function textCriteriaMatches(itemOrElement, textCriteria) {
  if (textCriteria === undefined) {
    return true;
  }

  let text = getItemText(itemOrElement);
  text = text.trim().toLowerCase();

  if (text.length === 0) {
    return false;
  }

  if (textCriteria.repeating) {
    return text[0] === textCriteria.keys[0];
  }

  return text.startsWith(textCriteria.keys.join(''));
}

function isItemFocusableWithTextCriteria(item, criteria) {
  if (!textCriteriaMatches(item, criteria)) {
    return false;
  }

  return isRovingTabIndexItemFocusable(item);
}

/**
 * A permanently displayed menu following https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/.
 * It's exposed to help customization of the [`Menu`](/material-ui/api/menu/) component if you
 * use it separately you need to move focus into the component manually. Once
 * the focus is placed inside the component it is fully keyboard accessible.
 */
const MenuList = React.forwardRef(function MenuList(props, ref) {
  const {
    // private
    // eslint-disable-next-line react/prop-types
    actions,
    autoFocus = false,
    autoFocusItem = false,
    children,
    className,
    disabledItemsFocusable = false,
    disableListWrap = false,
    onKeyDown,
    variant = 'selectedMenu',
    ...other
  } = props;
  const listRef = React.useRef(null);
  const hasAutoFocusedRef = React.useRef(false);
  const textCriteriaRef = React.useRef({
    keys: [],
    repeating: true,
    previousKeyMatched: true,
    lastTime: null,
  });

  const getDefaultActiveItemId = React.useCallback(
    (items) => {
      if (variant === 'selectedMenu') {
        return (
          items.find((item) => item.selected && isRovingTabIndexItemFocusable(item))?.id ??
          items.find((item) => isRovingTabIndexItemFocusable(item))?.id ??
          null
        );
      }

      return items.find((item) => isRovingTabIndexItemFocusable(item))?.id ?? null;
    },
    [variant],
  );

  const rovingTabIndex = useRovingTabIndexRoot({
    activeItemId: undefined,
    getDefaultActiveItemId,
    orientation: 'vertical',
    shouldWrap: !disableListWrap,
  });
  const { activeItemId, focusActiveItem, focusNext, getActiveItem, getContainerProps } =
    rovingTabIndex;

  useEnhancedEffect(() => {
    if (!autoFocus) {
      hasAutoFocusedRef.current = false;
      return undefined;
    }

    if (hasAutoFocusedRef.current || !listRef.current) {
      return undefined;
    }

    if (autoFocusItem) {
      const focusedItemId = focusActiveItem();

      if (focusedItemId !== null) {
        hasAutoFocusedRef.current = true;
        return undefined;
      }
    }

    listRef.current.focus();
    hasAutoFocusedRef.current = true;

    return undefined;
  }, [autoFocus, autoFocusItem, focusActiveItem]);

  React.useImperativeHandle(
    actions,
    () => ({
      adjustStyleForScrollbar: (containerElement, { direction }) => {
        // Let's ignore that piece of logic if users are already overriding the width
        // of the menu.
        const noExplicitWidth = !listRef.current.style.width;
        if (containerElement.clientHeight < listRef.current.clientHeight && noExplicitWidth) {
          const scrollbarSize = `${getScrollbarSize(ownerWindow(containerElement))}px`;
          listRef.current.style[direction === 'rtl' ? 'paddingLeft' : 'paddingRight'] =
            scrollbarSize;
          listRef.current.style.width = `calc(100% + ${scrollbarSize})`;
        }
        return listRef.current;
      },
      focusIfNoActiveItem: () => {
        if (!listRef.current || getActiveItem() !== null) {
          return null;
        }

        listRef.current.focus();
        return listRef.current;
      },
    }),
    [getActiveItem],
  );

  const rovingTabIndexContainerProps = getContainerProps();
  const handleRef = useForkRef(listRef, rovingTabIndexContainerProps.ref, ref);
  const menuListContextValue = React.useMemo(
    () => ({
      activeItemId,
      autoFocusItem,
      disabledItemsFocusable,
      variant,
    }),
    [activeItemId, autoFocusItem, disabledItemsFocusable, variant],
  );

  const handleKeyDown = (event) => {
    const isModifierKeyPressed = event.ctrlKey || event.metaKey || event.altKey;

    if (isModifierKeyPressed && onKeyDown) {
      onKeyDown(event);

      return;
    }

    rovingTabIndexContainerProps.onKeyDown(event);

    if (event.key.length === 1) {
      const criteria = textCriteriaRef.current;
      const lowerKey = event.key.toLowerCase();
      const currTime = performance.now();

      if (criteria.keys.length > 0) {
        // Reset
        if (currTime - criteria.lastTime > 500) {
          criteria.keys = [];
          criteria.repeating = true;
          criteria.previousKeyMatched = true;
        } else if (criteria.repeating && lowerKey !== criteria.keys[0]) {
          criteria.repeating = false;
        }
      }

      criteria.lastTime = currTime;
      criteria.keys.push(lowerKey);

      const currentFocus = getActiveElement(ownerDocument(listRef.current));
      const keepFocusOnCurrent =
        currentFocus && !criteria.repeating && textCriteriaMatches(currentFocus, criteria);

      if (
        criteria.previousKeyMatched &&
        (keepFocusOnCurrent ||
          focusNext((item) => isItemFocusableWithTextCriteria(item, criteria)) !== null)
      ) {
        event.preventDefault();
      } else {
        criteria.previousKeyMatched = false;
      }
    }

    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  return (
    <List
      role="menu"
      ref={handleRef}
      className={className}
      onKeyDown={handleKeyDown}
      onFocus={rovingTabIndexContainerProps.onFocus}
      tabIndex={-1}
      {...other}
    >
      <MenuListContext.Provider value={menuListContextValue}>
        <RovingTabIndexProvider value={rovingTabIndex}>{children}</RovingTabIndexProvider>
      </MenuListContext.Provider>
    </List>
  );
});

MenuList.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, will focus the `[role="menu"]` container.
   * @default false
   */
  autoFocus: PropTypes.bool,
  /**
   * If `true`, will focus the first menuitem if `variant="menu"` or selected item
   * if `variant="selectedMenu"`.
   * @default false
   */
  autoFocusItem: PropTypes.bool,
  /**
   * MenuList contents, normally `MenuItem`s.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * If `true`, will allow focus on disabled items.
   * @default false
   */
  disabledItemsFocusable: PropTypes.bool,
  /**
   * If `true`, the menu items will not wrap focus.
   * @default false
   */
  disableListWrap: PropTypes.bool,
  /**
   * @ignore
   */
  onKeyDown: PropTypes.func,
  /**
   * The variant to use. Use `menu` to prevent selected items from impacting the initial focus.
   * @default 'selectedMenu'
   */
  variant: PropTypes.oneOf(['menu', 'selectedMenu']),
};

export default MenuList;
