import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import Chip from '@mui/material/Chip';
import ChipDelete from '@mui/material/ChipDelete';

describe('<ChipDelete />', () => {
  const { render } = createRenderer();

  describe('rendering', () => {
    it('renders a <button> with type="button" and aria-label="Remove" by default', () => {
      render(<Chip label="Chip" endAdornment={<ChipDelete />} />);

      const button = screen.getByRole('button');
      expect(button.tagName).to.equal('BUTTON');
      expect(button).to.have.attribute('type', 'button');
      expect(button).to.have.attribute('aria-label', 'Remove');
    });

    it('renders inside startAdornment', () => {
      render(<Chip label="Chip" startAdornment={<ChipDelete />} />);

      const button = screen.getByRole('button');
      expect(button.tagName).to.equal('BUTTON');
      expect(button).to.have.attribute('type', 'button');
    });

    it('renders with muiName for Chip validation', () => {
      expect((ChipDelete as any).muiName).to.equal('ChipDelete');
    });
  });

  describe('interaction', () => {
    it('fires onClick', () => {
      const handleClick = spy();
      render(<Chip label="Chip" endAdornment={<ChipDelete onClick={handleClick} />} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick.callCount).to.equal(1);
    });

    it('fires onClick from startAdornment', () => {
      const handleClick = spy();
      render(<Chip label="Chip" startAdornment={<ChipDelete onClick={handleClick} />} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick.callCount).to.equal(1);
    });

    it('calls event.stopPropagation() on click', () => {
      const handleChipClick = spy();
      render(
        <div onClick={handleChipClick}>
          <Chip label="Chip" endAdornment={<ChipDelete onClick={() => {}} />} />
        </div>,
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleChipClick.callCount).to.equal(0);
    });

    it('calls event.stopPropagation() for keyboard-triggered Enter clicks on non-native roots', () => {
      const handleChipClick = spy();
      const handleDeleteClick = spy();

      render(
        <div onClick={handleChipClick}>
          <Chip
            label="Chip"
            endAdornment={<ChipDelete component="div" onClick={handleDeleteClick} />}
          />
        </div>,
      );

      const button = screen.getByRole('button');
      act(() => {
        button.focus();
      });

      fireEvent.keyDown(button, { key: 'Enter' });

      expect(handleDeleteClick.callCount).to.equal(1);
      expect(handleChipClick.callCount).to.equal(0);
    });

    it('calls event.stopPropagation() for keyboard-triggered Space clicks on non-native roots', () => {
      const handleChipClick = spy();
      const handleDeleteClick = spy();

      render(
        <div onClick={handleChipClick}>
          <Chip
            label="Chip"
            endAdornment={<ChipDelete component="div" onClick={handleDeleteClick} />}
          />
        </div>,
      );

      const button = screen.getByRole('button');
      act(() => {
        button.focus();
      });

      fireEvent.keyDown(button, { key: ' ' });
      fireEvent.keyUp(button, { key: ' ' });

      expect(handleDeleteClick.callCount).to.equal(1);
      expect(handleChipClick.callCount).to.equal(0);
    });
  });

  describe('disabled', () => {
    it('inherits disabled from parent Chip', () => {
      render(<Chip label="Chip" disabled endAdornment={<ChipDelete onClick={() => {}} />} />);

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('aria-disabled', 'true');
    });

    it('does not fire onClick when disabled', () => {
      const handleClick = spy();
      render(<Chip label="Chip" disabled endAdornment={<ChipDelete onClick={handleClick} />} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick.callCount).to.equal(0);
    });

    it('still calls stopPropagation when disabled', () => {
      const handleParentClick = spy();
      render(
        <div onClick={handleParentClick}>
          <Chip label="Chip" disabled endAdornment={<ChipDelete onClick={() => {}} />} />
        </div>,
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleParentClick.callCount).to.equal(0);
    });

    it('renders disabled when focusableWhenDisabled=false', () => {
      render(
        <Chip
          label="Chip"
          disabled
          endAdornment={<ChipDelete onClick={() => {}} focusableWhenDisabled={false} />}
        />,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('disabled');
    });
  });

  describe('component prop', () => {
    it('component="div" renders a <div> with role="button", aria-label, and no type', () => {
      render(
        <Chip label="Chip" endAdornment={<ChipDelete component="div" onClick={() => {}} />} />,
      );

      const el = screen.getByRole('button');
      expect(el.tagName).to.equal('DIV');
      expect(el).to.have.attribute('role', 'button');
      expect(el).to.have.attribute('aria-label', 'Remove');
      expect(el).not.to.have.attribute('type');
    });

    it('ref points to rendered root', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Chip
          label="Chip"
          endAdornment={<ChipDelete component="div" ref={ref} onClick={() => {}} />}
        />,
      );

      expect(ref.current).not.to.equal(null);
      expect(ref.current!.tagName).to.equal('DIV');
    });

    it('Enter activates click on non-native roots', () => {
      const handleClick = spy();
      render(
        <Chip label="Chip" endAdornment={<ChipDelete component="div" onClick={handleClick} />} />,
      );

      const el = screen.getByRole('button');
      act(() => {
        el.focus();
      });
      fireEvent.keyDown(el, { key: 'Enter' });
      expect(handleClick.callCount).to.equal(1);
    });

    it('Space activates click on non-native roots', () => {
      const handleClick = spy();
      render(
        <Chip label="Chip" endAdornment={<ChipDelete component="div" onClick={handleClick} />} />,
      );

      const el = screen.getByRole('button');
      act(() => {
        el.focus();
      });
      fireEvent.keyDown(el, { key: ' ' });
      expect(handleClick.callCount).to.equal(0);
      fireEvent.keyUp(el, { key: ' ' });
      expect(handleClick.callCount).to.equal(1);
    });

    it('stopPropagation is preserved with custom component', () => {
      const handleParentClick = spy();
      render(
        <div onClick={handleParentClick}>
          <Chip label="Chip" endAdornment={<ChipDelete component="div" onClick={() => {}} />} />
        </div>,
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleParentClick.callCount).to.equal(0);
    });

    it('disabled non-native root: click handler does not fire', () => {
      const handleClick = spy();
      render(
        <Chip
          label="Chip"
          disabled
          endAdornment={<ChipDelete component="div" onClick={handleClick} />}
        />,
      );

      const el = screen.getByRole('button');
      fireEvent.click(el);
      expect(handleClick.callCount).to.equal(0);
    });

    it('disabled + focusableWhenDisabled works for non-native roots', () => {
      render(
        <Chip
          label="Chip"
          disabled
          endAdornment={<ChipDelete component="div" onClick={() => {}} />}
        />,
      );

      const el = screen.getByRole('button');
      expect(el).to.have.attribute('aria-disabled', 'true');
      expect(el).not.to.have.attribute('disabled');
    });

    it('component does not leak as a DOM attribute', () => {
      render(
        <Chip label="Chip" endAdornment={<ChipDelete component="div" onClick={() => {}} />} />,
      );

      const el = screen.getByRole('button');
      expect(el).not.to.have.attribute('component');
    });

    it('component="a" without href behaves as non-native button', () => {
      render(<Chip label="Chip" endAdornment={<ChipDelete component="a" onClick={() => {}} />} />);

      const el = screen.getByRole('button');
      expect(el.tagName).to.equal('A');
      expect(el).to.have.attribute('role', 'button');
      expect(el).not.to.have.attribute('type');
    });
  });

  describe('prop: nativeButton', () => {
    it('applies native button semantics by default for custom components rendering <button>', () => {
      const CustomButton = React.forwardRef<HTMLButtonElement>(function CustomButton(props, ref) {
        return <button ref={ref} {...props} />;
      });

      render(
        <Chip
          label="Chip"
          endAdornment={<ChipDelete component={CustomButton} onClick={() => {}} />}
        />,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.property('tagName', 'BUTTON');
      expect(button).to.have.attribute('type', 'button');
      expect(button).not.to.have.attribute('role');
    });

    it('uses native disabled by default for custom components rendering <button>', () => {
      const CustomButton = React.forwardRef<HTMLButtonElement>(function CustomButton(props, ref) {
        return <button ref={ref} {...props} />;
      });

      render(
        <Chip
          label="Chip"
          disabled
          endAdornment={
            <ChipDelete component={CustomButton} focusableWhenDisabled={false} onClick={() => {}} />
          }
        />,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('disabled');
      expect(button).not.to.have.attribute('role');
    });

    it('nativeButton={false} applies non-native semantics for custom components', () => {
      const CustomSpan = React.forwardRef<HTMLSpanElement>(function CustomSpan(props, ref) {
        return <span ref={ref} {...props} />;
      });

      render(
        <Chip
          label="Chip"
          endAdornment={
            <ChipDelete component={CustomSpan} nativeButton={false} onClick={() => {}} />
          }
        />,
      );

      const el = screen.getByRole('button');
      expect(el).to.have.property('tagName', 'SPAN');
      expect(el).to.have.attribute('role', 'button');
      expect(el).not.to.have.attribute('type');
    });

    it('warns when a custom component renders a non-button without nativeButton', () => {
      const CustomSpan = React.forwardRef<HTMLSpanElement>(function CustomSpan(props, ref) {
        return <span ref={ref} {...props} />;
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <Chip
          label="Chip"
          endAdornment={<ChipDelete component={CustomSpan} onClick={() => {}} />}
        />,
      );

      const messages = errorSpy.mock.calls.map((call) => String(call[0]).toLowerCase());
      expect(
        messages.some((msg) => msg.includes('nativebutton') && msg.includes('non-<button>')),
      ).to.equal(true);
      errorSpy.mockRestore();
    });
  });
});
