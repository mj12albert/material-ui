'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { isItemFocusable } from '@mui/utils/useRovingTabIndex';
import ownerDocument from '../utils/ownerDocument';
import List from '../List';
import getActiveElement from '../utils/getActiveElement';
import getScrollbarSize from '../utils/getScrollbarSize';
import focusWithVisible from '../utils/focusWithVisible';
import useEventCallback from '../utils/useEventCallback';
import useForkRef from '../utils/useForkRef';
import useEnhancedEffect from '../utils/useEnhancedEffect';
import { RovingTabIndexContext, useRovingTabIndexRoot } from '../utils/useRovingTabIndex';
import ownerWindow from '../utils/ownerWindow';
import { useSelectFocusSource } from '../Select/utils';
import { MenuListContext } from './MenuListContext';

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

  return isItemFocusable(item);
}

// Menu auto-focus is not always keyboard-driven. On open we often move focus to the
// active item programmatically so arrow-key navigation starts from the right place,
// but in `variant="menu"` the selected item is still the intended visual highlight.
//
// If we mark that programmatic focus as focus-visible when there is no known keyboard
// focus source, the first item can incorrectly pick up `Mui-focusVisible` and visually
// compete with the selected item. Preserve focus-visible only when the caller gave us
// an explicit focus source (for example Select forwarding keyboard intent); otherwise
// focus the item without requesting focus-visible styling.
function focusAutoFocusItem(element, focusSource) {
  if (focusSource != null) {
    focusWithVisible(element, focusSource);
    return;
  }

  try {
    element.focus({ focusVisible: false });
  } catch (error) {
    element.focus();
  }
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
  const focusSource = useSelectFocusSource();
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
          items.find((item) => item.selected && isItemFocusable(item))?.id ??
          items.find((item) => isItemFocusable(item))?.id ??
          null
        );
      }

      return items.find((item) => isItemFocusable(item))?.id ?? null;
    },
    [variant],
  );

  const rovingContainer = useRovingTabIndexRoot({
    activeItemId: undefined,
    getDefaultActiveItemId,
    orientation: 'vertical',
    wrap: !disableListWrap,
  });
  const { activeItemId, focusNext, getActiveItem, getContainerProps } = rovingContainer;

  const focusAutoFocusTarget = useEventCallback((force = false) => {
    // `force` is used by the imperative action when Menu asks MenuList to restore focus,
    // even if this list already ran its one-time auto-focus path on an earlier render.
    if (!listRef.current || (!force && hasAutoFocusedRef.current)) {
      return null;
    }

    if (autoFocusItem) {
      const activeItem = getActiveItem();

      if (activeItem?.element) {
        focusAutoFocusItem(activeItem.element, focusSource);
        hasAutoFocusedRef.current = true;
        return activeItem.element;
      }

      if (!autoFocus) {
        return null;
      }

      // Keep the list container focusable while waiting for items to register,
      // or when there is no focusable item to move to.
      listRef.current.focus();
      return listRef.current;
    }

    if (!autoFocus) {
      return null;
    }

    listRef.current.focus();
    hasAutoFocusedRef.current = true;
    return listRef.current;
  });

  useEnhancedEffect(() => {
    if (!autoFocus && !autoFocusItem) {
      hasAutoFocusedRef.current = false;
      return undefined;
    }

    focusAutoFocusTarget();

    return undefined;
  }, [activeItemId, autoFocus, autoFocusItem, focusAutoFocusTarget]);

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
      focusAutoFocusTarget: () => {
        if (!listRef.current) {
          return null;
        }

        const currentFocus = getActiveElement(ownerDocument(listRef.current));

        if (currentFocus && listRef.current.contains(currentFocus)) {
          return currentFocus;
        }

        return focusAutoFocusTarget(true);
      },
    }),
    [focusAutoFocusTarget],
  );

  const rovingContainerProps = getContainerProps();
  const handleRef = useForkRef(listRef, rovingContainerProps.ref, ref);
  const menuListContextValue = React.useMemo(
    () => ({
      itemsFocusableWhenDisabled: disabledItemsFocusable,
      variant,
    }),
    [disabledItemsFocusable, variant],
  );

  const handleKeyDown = useEventCallback((event) => {
    const isModifierKeyPressed = event.ctrlKey || event.metaKey || event.altKey;

    if (isModifierKeyPressed && onKeyDown) {
      onKeyDown(event);

      return;
    }

    rovingContainerProps.onKeyDown(event);

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
  });

  return (
    <List
      role="menu"
      ref={handleRef}
      className={className}
      onKeyDown={handleKeyDown}
      onFocus={rovingContainerProps.onFocus}
      tabIndex={-1}
      {...other}
    >
      <MenuListContext.Provider value={menuListContextValue}>
        <RovingTabIndexContext.Provider value={rovingContainer}>
          {children}
        </RovingTabIndexContext.Provider>
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
   * If `true`, will focus the `[role="menu"]` container and move into tab order.
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
   * The variant to use. Use `menu` to prevent selected items from impacting the initial focus
   * and the vertical alignment relative to the anchor element.
   * @default 'selectedMenu'
   */
  variant: PropTypes.oneOf(['menu', 'selectedMenu']),
};

export default MenuList;
