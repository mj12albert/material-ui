import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import ChipLink, { chipLinkClasses as classes } from '@mui/material/ChipLink';
import * as rippleTest from '../../test/ripple';

describe('<ChipLink />', () => {
  const { render } = createRenderer();

  describe('non-overlay mode (no onDelete)', () => {
    it('renders a single <a> root', () => {
      render(<ChipLink label="Chip" href="#" />);

      const link = screen.getByRole('link');
      expect(link).to.have.class(classes.root);
      expect(link).to.have.tagName('A');
      expect(link).to.have.attribute('href', '#');
    });

    it('fires onClick on the root link', () => {
      const handleClick = spy();
      render(<ChipLink label="Chip" href="#" onClick={handleClick} />);

      fireEvent.click(screen.getByRole('link'));
      expect(handleClick.callCount).to.equal(1);
    });

    it('composes onKeyDown handlers', () => {
      const handleKeyDown = spy();
      render(<ChipLink label="Chip" href="#" onKeyDown={handleKeyDown} />);

      const link = screen.getByRole('link');
      act(() => {
        link.focus();
      });
      fireEvent.keyDown(link, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(1);
    });
  });

  describe('overlay mode (with onDelete)', () => {
    it('renders root div + action link + delete button (2 tab stops)', () => {
      render(<ChipLink label="Chip" href="#" onDelete={() => {}} />);

      const link = screen.getByRole('link');
      const buttons = screen.getAllByRole('button');
      expect(buttons).to.have.length(1); // delete button only

      const root = document.querySelector(`.${classes.root}`);
      expect(root).to.have.tagName('DIV');
      expect(link).to.have.attribute('href', '#');
    });

    it('connects action to label via aria-labelledby', () => {
      render(<ChipLink label="Chip" href="#" onDelete={() => {}} />);

      const actionLink = screen.getByRole('link', { name: 'Chip' });
      expect(actionLink).to.have.attribute('aria-labelledby');

      const labelId = actionLink.getAttribute('aria-labelledby')!;
      const label = document.getElementById(labelId);
      expect(label).to.have.text('Chip');
    });

    it('renders delete button with aria-label', () => {
      render(<ChipLink label="Chip" href="#" onDelete={() => {}} deleteLabel="Remove chip" />);

      expect(screen.getByRole('button', { name: 'Remove chip' })).not.to.equal(null);
    });

    it('fires onDelete when delete button is clicked', () => {
      const handleDelete = spy();
      render(<ChipLink label="Chip" href="#" onDelete={handleDelete} />);

      const deleteButton = screen.getByRole('button', { name: 'Remove' });
      fireEvent.click(deleteButton);
      expect(handleDelete.callCount).to.equal(1);
    });

    it('fires onDelete on Backspace/Delete keyup on action', () => {
      const handleDelete = spy();
      render(<ChipLink label="Chip" href="#" onDelete={handleDelete} />);

      const actionLink = screen.getByRole('link', { name: 'Chip' });
      act(() => {
        actionLink.focus();
      });
      fireEvent.keyDown(actionLink, { key: 'Backspace' });
      fireEvent.keyUp(actionLink, { key: 'Backspace' });
      expect(handleDelete.callCount).to.equal(1);

      fireEvent.keyDown(actionLink, { key: 'Delete' });
      fireEvent.keyUp(actionLink, { key: 'Delete' });
      expect(handleDelete.callCount).to.equal(2);
    });

    it('fires onClick on the action link', () => {
      const handleClick = spy();
      render(<ChipLink label="Chip" href="#" onClick={handleClick} onDelete={() => {}} />);

      const actionLink = screen.getByRole('link', { name: 'Chip' });
      fireEvent.click(actionLink);
      expect(handleClick.callCount).to.equal(1);
    });

    it('composes onKeyDown on the action link', () => {
      const handleKeyDown = spy();
      render(<ChipLink label="Chip" href="#" onKeyDown={handleKeyDown} onDelete={() => {}} />);

      const actionLink = screen.getByRole('link', { name: 'Chip' });
      act(() => {
        actionLink.focus();
      });
      fireEvent.keyDown(actionLink, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(1);
    });
  });

  describe('ripple', () => {
    const RIPPLE_CLASS = '.MuiTouchRipple-root';

    it('mounts TouchRipple inside root link after mouseDown in non-overlay mode', async () => {
      render(<ChipLink label="Chip" href="#" />);

      const link = screen.getByRole('link');
      expect(link.querySelector(RIPPLE_CLASS)).to.equal(null);

      await rippleTest.startTouch(link);
      expect(link.querySelector(RIPPLE_CLASS)).not.to.equal(null);
    });

    it('mounts TouchRipple inside action link after mouseDown in overlay mode', async () => {
      render(<ChipLink label="Chip" href="#" onDelete={() => {}} />);

      const actionLink = screen.getByRole('link', { name: 'Chip' });
      expect(actionLink.querySelector(RIPPLE_CLASS)).to.equal(null);

      await rippleTest.startTouch(actionLink);
      expect(actionLink.querySelector(RIPPLE_CLASS)).not.to.equal(null);
    });

    it('does not produce ripple anywhere when delete button is clicked', () => {
      const handleClick = spy();
      const handleDelete = spy();
      render(<ChipLink label="Chip" href="#" onClick={handleClick} onDelete={handleDelete} />);

      const deleteButton = screen.getByRole('button', { name: 'Remove' });
      fireEvent.mouseDown(deleteButton);
      fireEvent.click(deleteButton);

      const root = document.querySelector(`.${classes.root}`)!;
      expect(root.querySelector(RIPPLE_CLASS)).to.equal(null);
      expect(handleDelete.callCount).to.equal(1);
      expect(handleClick.callCount).to.equal(0);
    });
  });

  describe('no disabled state', () => {
    it('does not accept a disabled prop', () => {
      // ChipLink has no disabled prop — links should be removed, not disabled.
      // This test verifies the root never renders aria-disabled or disabled.
      render(<ChipLink label="Chip" href="#" />);

      const link = screen.getByRole('link');
      expect(link).not.to.have.attribute('disabled');
      expect(link).not.to.have.attribute('aria-disabled');
    });
  });
});
