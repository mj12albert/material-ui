import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import ChipButton, { chipButtonClasses as classes } from '@mui/material/ChipButton';

describe('<ChipButton />', () => {
  const { render } = createRenderer();

  describe('type prop enforcement', () => {
    it('renders type="button" on root in non-delete mode', () => {
      render(<ChipButton label="Chip" />);

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('type', 'button');
    });

    it('ignores type passed via slotProps.root in non-delete mode', () => {
      render(<ChipButton label="Chip" slotProps={{ root: { type: 'submit' } }} />);

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('type', 'button');
    });

    it('renders type="button" on the action overlay in delete mode', () => {
      render(<ChipButton label="Chip" onDelete={() => {}} />);

      const actionButton = screen.getByRole('button', { name: 'Chip' });
      expect(actionButton).to.have.attribute('type', 'button');
    });

    it('allows slotProps.action to customize action type', () => {
      render(
        <ChipButton
          label="Chip"
          onDelete={() => {}}
          slotProps={{ action: { type: 'submit' } }}
        />,
      );

      const actionButton = screen.getByRole('button', { name: 'Chip' });
      expect(actionButton).to.have.attribute('type', 'submit');
    });
  });

  describe('non-overlay mode (no onDelete)', () => {
    it('renders a single <button> root', () => {
      render(<ChipButton label="Chip" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).to.have.length(1);
      expect(buttons[0]).to.have.class(classes.root);
    });

    it('fires onClick on the root button', () => {
      const handleClick = spy();
      render(<ChipButton label="Chip" onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick.callCount).to.equal(1);
    });

    it('composes onKeyDown handlers', () => {
      const handleKeyDown = spy();
      render(<ChipButton label="Chip" onKeyDown={handleKeyDown} />);

      const button = screen.getByRole('button');
      act(() => {
        button.focus();
      });
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(1);
    });
  });

  describe('overlay mode (with onDelete)', () => {
    it('renders root div + action button + delete button (2 tab stops)', () => {
      render(<ChipButton label="Chip" onDelete={() => {}} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).to.have.length(2);

      const root = document.querySelector(`.${classes.root}`);
      expect(root).to.have.tagName('DIV');
    });

    it('connects action to label via aria-labelledby', () => {
      render(<ChipButton label="Chip" onDelete={() => {}} />);

      const actionButton = screen.getByRole('button', { name: 'Chip' });
      expect(actionButton).to.have.attribute('aria-labelledby');

      const labelId = actionButton.getAttribute('aria-labelledby');
      const label = document.getElementById(labelId);
      expect(label).to.have.text('Chip');
    });

    it('renders delete button with aria-label', () => {
      render(<ChipButton label="Chip" onDelete={() => {}} deleteLabel="Remove chip" />);

      expect(screen.getByRole('button', { name: 'Remove chip' })).not.to.equal(null);
    });

    it('fires onDelete when delete button is clicked', () => {
      const handleDelete = spy();
      render(<ChipButton label="Chip" onDelete={handleDelete} />);

      const deleteButton = screen.getByRole('button', { name: 'Remove' });
      fireEvent.click(deleteButton);
      expect(handleDelete.callCount).to.equal(1);
    });

    it('fires onDelete on Backspace/Delete keyup on action', () => {
      const handleDelete = spy();
      render(<ChipButton label="Chip" onDelete={handleDelete} />);

      const actionButton = screen.getByRole('button', { name: 'Chip' });
      act(() => {
        actionButton.focus();
      });
      fireEvent.keyDown(actionButton, { key: 'Backspace' });
      fireEvent.keyUp(actionButton, { key: 'Backspace' });
      expect(handleDelete.callCount).to.equal(1);

      fireEvent.keyDown(actionButton, { key: 'Delete' });
      fireEvent.keyUp(actionButton, { key: 'Delete' });
      expect(handleDelete.callCount).to.equal(2);
    });

    it('fires onClick on the action button', () => {
      const handleClick = spy();
      render(<ChipButton label="Chip" onClick={handleClick} onDelete={() => {}} />);

      const actionButton = screen.getByRole('button', { name: 'Chip' });
      fireEvent.click(actionButton);
      expect(handleClick.callCount).to.equal(1);
    });

    it('composes onKeyDown on the action button', () => {
      const handleKeyDown = spy();
      render(<ChipButton label="Chip" onKeyDown={handleKeyDown} onDelete={() => {}} />);

      const actionButton = screen.getByRole('button', { name: 'Chip' });
      act(() => {
        actionButton.focus();
      });
      fireEvent.keyDown(actionButton, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(1);
    });
  });

  describe('disabled + focusableWhenDisabled', () => {
    it('renders aria-disabled instead of disabled when focusableWhenDisabled', () => {
      render(<ChipButton label="Chip" disabled />);

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('aria-disabled', 'true');
      expect(button).not.to.have.attribute('disabled');
    });

    it('renders disabled when focusableWhenDisabled=false', () => {
      render(<ChipButton label="Chip" disabled focusableWhenDisabled={false} />);

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('disabled');
    });

    it('does not fire onDelete via keyboard when disabled', () => {
      const handleDelete = spy();
      render(<ChipButton label="Chip" disabled onDelete={handleDelete} />);

      const actionButton = screen.getByRole('button', { name: 'Chip' });
      act(() => {
        actionButton.focus();
      });
      fireEvent.keyDown(actionButton, { key: 'Backspace' });
      fireEvent.keyUp(actionButton, { key: 'Backspace' });
      expect(handleDelete.callCount).to.equal(0);

      fireEvent.keyDown(actionButton, { key: 'Delete' });
      fireEvent.keyUp(actionButton, { key: 'Delete' });
      expect(handleDelete.callCount).to.equal(0);
    });
  });

  describe('type stripping', () => {
    it('ignores slotProps.root.type in delete mode', () => {
      render(
        <ChipButton
          label="Chip"
          onDelete={() => {}}
          slotProps={{ root: { type: 'submit' } }}
        />,
      );

      const root = document.querySelector(`.${classes.root}`);
      expect(root).not.to.have.attribute('type');
    });
  });
});
