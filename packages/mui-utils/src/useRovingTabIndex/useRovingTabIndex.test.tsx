import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import useRovingTabIndex, {
  type UseRovingTabIndexOptions,
  useRovingTabIndexRoot,
  useRovingTabIndexItem,
  RovingTabIndexProvider,
} from './useRovingTabIndex';

type TestItem = {
  id: string;
  ariaDisabled?: boolean;
  disabled?: boolean;
  focusableWhenDisabled?: boolean;
  render?: boolean;
  selected?: boolean;
  tabIndex?: number;
};

let focusNext: ReturnType<typeof useRovingTabIndex<string>>['focusNext'];
let getItemMap: ReturnType<typeof useRovingTabIndex<string>>['getItemMap'];

const defaultItems: TestItem[] = [
  { id: 'button-1' },
  { id: 'button-2' },
  { id: 'button-3', disabled: true },
  { id: 'button-4' },
];

function TestComponent(
  props: Partial<UseRovingTabIndexOptions<string>> & {
    items?: TestItem[];
    buttonRef?: React.Ref<HTMLButtonElement>;
  },
) {
  const { items = defaultItems, buttonRef, ...options } = props;
  const {
    getItemProps,
    getContainerProps,
    getItemMap: getItemMapFn,
    focusNext: focusNextFn,
  } = useRovingTabIndex({
    orientation: 'horizontal',
    ...options,
  });

  focusNext = focusNextFn;
  getItemMap = getItemMapFn;

  return (
    <div data-testid="container" tabIndex={-1} {...getContainerProps()}>
      {items
        .filter((item) => item.render !== false)
        .map((item) => {
          const rovingItemProps = getItemProps({
            id: item.id,
            ref: item.id === 'button-1' ? buttonRef : undefined,
            disabled: item.disabled,
            focusableWhenDisabled: item.focusableWhenDisabled,
            selected: item.selected,
          });

          return (
            <button
              {...rovingItemProps}
              aria-disabled={
                item.ariaDisabled || (item.focusableWhenDisabled && item.disabled)
                  ? 'true'
                  : undefined
              }
              data-testid={item.id}
              disabled={item.disabled && !item.focusableWhenDisabled ? true : undefined}
              key={item.id}
              role="tab"
              tabIndex={item.tabIndex ?? rovingItemProps.tabIndex}
            >
              {item.id}
            </button>
          );
        })}
    </div>
  );
}

describe('useRovingTabIndex', () => {
  const { render } = createRenderer();

  test('sets the first enabled item as the default tab stop', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('button-1')).to.have.attribute('tabindex', '0');
    expect(screen.getByTestId('button-2')).to.have.attribute('tabindex', '-1');
    expect(screen.getByTestId('button-3')).to.have.attribute('tabindex', '-1');
    expect(screen.getByTestId('button-4')).to.have.attribute('tabindex', '-1');
  });

  test('uses activeItemId when provided', () => {
    render(<TestComponent activeItemId="button-2" />);

    expect(screen.getByTestId('button-1')).to.have.attribute('tabindex', '-1');
    expect(screen.getByTestId('button-2')).to.have.attribute('tabindex', '0');
  });

  test('syncs to activeItemId when it changes', () => {
    const { setProps } = render(<TestComponent activeItemId="button-2" />);

    setProps({ activeItemId: 'button-4' });

    expect(screen.getByTestId('button-2')).to.have.attribute('tabindex', '-1');
    expect(screen.getByTestId('button-4')).to.have.attribute('tabindex', '0');
  });

  test('activeItemId=null falls back to the first focusable item', () => {
    render(<TestComponent activeItemId={null} />);

    expect(screen.getByTestId('button-1')).to.have.attribute('tabindex', '0');
    expect(screen.getByTestId('button-2')).to.have.attribute('tabindex', '-1');
  });

  test('moves to the next focusable item when the requested item is disabled', () => {
    render(<TestComponent activeItemId="button-3" />);

    expect(screen.getByTestId('button-3')).to.have.attribute('tabindex', '-1');
    expect(screen.getByTestId('button-4')).to.have.attribute('tabindex', '0');
  });

  test('re-resolves when mounted item metadata changes', async () => {
    const { setProps, user } = render(
      <TestComponent items={[{ id: 'button-1' }, { id: 'button-2' }, { id: 'button-3' }]} />,
    );

    setProps({
      items: [{ id: 'button-1', disabled: true }, { id: 'button-2' }, { id: 'button-3' }],
    });

    act(() => {
      screen.getByTestId('container').focus();
    });

    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('button-2')).toHaveFocus();
  });

  test('cleans up item map entries when items unregister', () => {
    const { setProps } = render(
      <TestComponent items={[{ id: 'button-1' }, { id: 'button-2' }, { id: 'button-3' }]} />,
    );

    expect(Array.from(getItemMap().keys())).to.deep.equal(['button-1', 'button-2', 'button-3']);

    setProps({
      items: [{ id: 'button-1' }, { id: 'button-3' }],
    });

    expect(Array.from(getItemMap().keys())).to.deep.equal(['button-1', 'button-3']);
  });

  test('should not infinite loop when focusNext is called with no children', () => {
    let focusNextResult: string | null = null;

    function EmptyContainer() {
      const { getContainerProps, focusNext: focusNextFn } = useRovingTabIndex<string>({
        orientation: 'horizontal',
      });

      focusNext = focusNextFn;

      return <div data-testid="container" tabIndex={-1} {...getContainerProps()} />;
    }

    render(<EmptyContainer />);

    act(() => {
      focusNextResult = focusNext();
    });

    expect(focusNextResult).to.equal(null);
  });

  test('should not infinite loop on arrow key navigation with no children', async () => {
    function EmptyContainer() {
      const { getContainerProps } = useRovingTabIndex<string>({
        orientation: 'horizontal',
      });

      return <div data-testid="container" tabIndex={-1} {...getContainerProps()} />;
    }

    const { user } = render(<EmptyContainer />);

    const container = screen.getByTestId('container');
    container.focus();

    // These would hang if the bug is present
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{Home}');
    await user.keyboard('{End}');

    expect(container).toHaveFocus();
  });

  test('should not infinite loop on arrow key navigation with no children (vertical)', async () => {
    function EmptyContainer() {
      const { getContainerProps } = useRovingTabIndex<string>({
        orientation: 'vertical',
      });

      return <div data-testid="container" tabIndex={-1} {...getContainerProps()} />;
    }

    const { user } = render(<EmptyContainer />);

    const container = screen.getByTestId('container');
    container.focus();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    expect(container).toHaveFocus();
  });

  test('leaves all items at tabindex -1 when none are focusable', () => {
    render(
      <TestComponent
        items={[
          { id: 'button-1', disabled: true },
          { id: 'button-2', disabled: true },
        ]}
      />,
    );

    expect(screen.getByTestId('button-1')).to.have.attribute('tabindex', '-1');
    expect(screen.getByTestId('button-2')).to.have.attribute('tabindex', '-1');
  });

  test('updates the active item when a child receives focus', async () => {
    const { user } = render(<TestComponent />);

    await user.click(screen.getByTestId('button-2'));

    expect(screen.getByTestId('button-1')).to.have.attribute('tabindex', '-1');
    expect(screen.getByTestId('button-2')).to.have.attribute('tabindex', '0');
  });

  test('supports horizontal keyboard navigation and skips disabled items', async () => {
    const { user } = render(<TestComponent />);

    await user.click(screen.getByTestId('button-1'));
    await user.keyboard('{ArrowRight}');

    expect(screen.getByTestId('button-2')).toHaveFocus();

    await user.keyboard('{ArrowRight}');

    expect(screen.getByTestId('button-4')).toHaveFocus();

    await user.keyboard('{ArrowLeft}');

    expect(screen.getByTestId('button-2')).toHaveFocus();
  });

  test('supports vertical keyboard navigation', async () => {
    const { user } = render(<TestComponent orientation="vertical" />);

    await user.click(screen.getByTestId('button-1'));
    await user.keyboard('{ArrowDown}');

    expect(screen.getByTestId('button-2')).toHaveFocus();

    await user.keyboard('{ArrowUp}');

    expect(screen.getByTestId('button-1')).toHaveFocus();
  });

  test('does not wrap when shouldWrap is false', async () => {
    const { user } = render(<TestComponent shouldWrap={false} />);

    await user.click(screen.getByTestId('button-4'));
    await user.keyboard('{ArrowRight}');

    expect(screen.getByTestId('button-4')).toHaveFocus();
  });

  test('supports Home and End navigation', async () => {
    const { user } = render(<TestComponent />);

    await user.click(screen.getByTestId('button-2'));
    await user.keyboard('{End}');

    expect(screen.getByTestId('button-4')).toHaveFocus();

    await user.keyboard('{Home}');

    expect(screen.getByTestId('button-1')).toHaveFocus();
  });

  test('starts from the root when navigating from root focus', async () => {
    const { user } = render(<TestComponent />);
    const container = screen.getByTestId('container');

    container.focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByTestId('button-1')).toHaveFocus();
  });

  test('ignores modifier key navigation', () => {
    render(<TestComponent />);
    const button1 = screen.getByTestId('button-1');

    act(() => {
      button1.focus();
    });

    fireEvent.keyDown(button1, { key: 'ArrowRight', ctrlKey: true });

    expect(button1).toHaveFocus();
  });

  test('reverses horizontal navigation in RTL mode', async () => {
    const { user } = render(<TestComponent isRtl />);

    await user.click(screen.getByTestId('button-1'));
    await user.keyboard('{ArrowLeft}');

    expect(screen.getByTestId('button-2')).toHaveFocus();
  });

  test('does not apply RTL reversal to vertical navigation', async () => {
    const { user } = render(<TestComponent orientation="vertical" isRtl />);

    await user.click(screen.getByTestId('button-1'));
    await user.keyboard('{ArrowDown}');

    expect(screen.getByTestId('button-2')).toHaveFocus();
  });

  test('supports item-based isItemFocusable overrides', async () => {
    const { user } = render(
      <TestComponent
        isItemFocusable={(item) =>
          item.id !== 'button-2' &&
          item.element?.dataset.disabled !== 'true' &&
          !item.disabled &&
          item.element?.getAttribute('aria-disabled') !== 'true'
        }
      />,
    );

    screen.getByTestId('button-4').dataset.disabled = 'true';

    await user.click(screen.getByTestId('button-1'));
    await user.keyboard('{ArrowRight}');

    expect(screen.getByTestId('button-1')).toHaveFocus();
  });

  test('keeps the current active item when new items register', async () => {
    const { setProps, user } = render(
      <TestComponent items={[{ id: 'button-1' }, { id: 'button-2' }]} />,
    );

    await user.click(screen.getByTestId('button-2'));

    setProps({
      items: [{ id: 'button-0' }, { id: 'button-1' }, { id: 'button-2' }],
    });

    expect(screen.getByTestId('button-2')).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByTestId('button-1')).toHaveFocus();
  });

  test('re-resolves when the active item unregisters', async () => {
    const { setProps, user } = render(
      <TestComponent items={[{ id: 'button-1' }, { id: 'button-2' }]} />,
    );

    await user.click(screen.getByTestId('button-2'));

    setProps({
      items: [{ id: 'button-1' }, { id: 'button-2', render: false }],
    });

    act(() => {
      screen.getByTestId('container').focus();
    });

    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('button-1')).toHaveFocus();
  });

  test('focusNext moves focus to the next focusable item and returns its id', async () => {
    const { user } = render(<TestComponent />);
    let focusNextResult: string | null = null;

    await user.click(screen.getByTestId('button-1'));

    act(() => {
      focusNextResult = focusNext();
    });

    expect(screen.getByTestId('button-2')).toHaveFocus();
    expect(focusNextResult).to.equal('button-2');
  });

  test('focusNext returns null when no focusable item matches', async () => {
    const { user } = render(<TestComponent />);
    let focusNextResult: string | null = null;

    await user.click(screen.getByTestId('button-1'));

    act(() => {
      focusNextResult = focusNext(() => false);
    });

    expect(focusNextResult).to.equal(null);
  });

  test('supports external refs on items', () => {
    const buttonRef = React.createRef<HTMLButtonElement>();

    render(<TestComponent buttonRef={buttonRef} />);

    expect(buttonRef.current).to.equal(screen.getByTestId('button-1'));
  });

  test('navigates in DOM order after dynamic item insertion', async () => {
    const { user, setProps } = render(
      <TestComponent items={[{ id: 'button-1' }, { id: 'button-2' }]} />,
    );

    setProps({
      items: [{ id: 'button-0' }, { id: 'button-1' }, { id: 'button-2' }],
    });

    await user.click(screen.getByTestId('button-0'));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('button-1')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('button-2')).toHaveFocus();
  });

  test('allows navigation to disabled items with focusableWhenDisabled', async () => {
    const { user } = render(
      <TestComponent
        items={[
          { id: 'button-1' },
          { id: 'button-2', disabled: true, focusableWhenDisabled: true },
          { id: 'button-3' },
        ]}
      />,
    );

    await user.click(screen.getByTestId('button-1'));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('button-2')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('button-3')).toHaveFocus();
  });
});

function ContextItem(props: { id: string; disabled?: boolean; focusableWhenDisabled?: boolean }) {
  const { id, disabled, focusableWhenDisabled } = props;
  const itemProps = useRovingTabIndexItem({ id, disabled, focusableWhenDisabled });

  return (
    <button
      {...itemProps}
      aria-disabled={disabled ? 'true' : undefined}
      data-testid={id}
      role="tab"
    >
      {id}
    </button>
  );
}

type ContextTestItem = {
  id: string;
  disabled?: boolean;
  render?: boolean;
};

function TestComponentWithContext(
  props: Partial<UseRovingTabIndexOptions<string>> & {
    items?: ContextTestItem[];
  },
) {
  const { items = [{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }], ...options } = props;
  const root = useRovingTabIndexRoot({
    orientation: 'horizontal',
    ...options,
  });
  const containerProps = root.getContainerProps();

  return (
    <RovingTabIndexProvider value={root}>
      <div data-testid="ctx-container" tabIndex={-1} {...containerProps}>
        {items
          .filter((item) => item.render !== false)
          .map((item) => (
            <ContextItem key={item.id} id={item.id} disabled={item.disabled} />
          ))}
      </div>
    </RovingTabIndexProvider>
  );
}

describe('useRovingTabIndexRoot + useRovingTabIndexItem (context-based API)', () => {
  const { render } = createRenderer();

  test('sets the first enabled item as the default tab stop', () => {
    render(<TestComponentWithContext />);

    expect(screen.getByTestId('item-1')).to.have.attribute('tabindex', '0');
    expect(screen.getByTestId('item-2')).to.have.attribute('tabindex', '-1');
    expect(screen.getByTestId('item-3')).to.have.attribute('tabindex', '-1');
  });

  test('supports keyboard navigation', async () => {
    const { user } = render(<TestComponentWithContext />);

    await user.click(screen.getByTestId('item-1'));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('item-2')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('item-3')).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByTestId('item-2')).toHaveFocus();
  });

  test('handles dynamic item insertion', async () => {
    const { setProps, user } = render(
      <TestComponentWithContext items={[{ id: 'item-1' }, { id: 'item-2' }]} />,
    );

    await user.click(screen.getByTestId('item-2'));

    setProps({
      items: [{ id: 'item-0' }, { id: 'item-1' }, { id: 'item-2' }],
    });

    expect(screen.getByTestId('item-2')).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByTestId('item-1')).toHaveFocus();
  });

  test('handles dynamic item removal', async () => {
    const { setProps, user } = render(
      <TestComponentWithContext items={[{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }]} />,
    );

    await user.click(screen.getByTestId('item-2'));

    setProps({
      items: [{ id: 'item-1' }, { id: 'item-3' }],
    });

    act(() => {
      screen.getByTestId('ctx-container').focus();
    });

    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('item-1')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('item-3')).toHaveFocus();
  });

  test('re-resolves when item metadata changes', async () => {
    const { setProps, user } = render(
      <TestComponentWithContext items={[{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }]} />,
    );

    setProps({
      items: [{ id: 'item-1', disabled: true }, { id: 'item-2' }, { id: 'item-3' }],
    });

    act(() => {
      screen.getByTestId('ctx-container').focus();
    });

    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('item-2')).toHaveFocus();
  });
});
