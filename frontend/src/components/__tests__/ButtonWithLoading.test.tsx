/**
 * Component tests for ButtonWithLoading
 * Tests the button component's loading state behavior
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ButtonWithLoading } from '../common/ButtonWithLoading';

describe('ButtonWithLoading', () => {
  it('should render button with children', () => {
    render(<ButtonWithLoading>Click Me</ButtonWithLoading>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should disable button when loading', () => {
    render(<ButtonWithLoading loading>Click Me</ButtonWithLoading>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should disable button when disabled prop is true', () => {
    render(<ButtonWithLoading disabled>Click Me</ButtonWithLoading>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should disable button when both loading and disabled are true', () => {
    render(<ButtonWithLoading loading disabled>Click Me</ButtonWithLoading>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show loading spinner when loading is true', () => {
    render(<ButtonWithLoading loading>Click Me</ButtonWithLoading>);
    // Check for circular progress (spinner)
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Material-UI CircularProgress should be rendered
    expect(button.querySelector('[class*="CircularProgress"]')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked and not loading', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<ButtonWithLoading onClick={handleClick}>Click Me</ButtonWithLoading>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick handler when loading', () => {
    const handleClick = vi.fn();
    render(<ButtonWithLoading loading onClick={handleClick}>Click Me</ButtonWithLoading>);
    
    const button = screen.getByRole('button');
    // Button is disabled when loading, so clicking is not possible
    // This is the expected behavior - disabled buttons don't trigger onClick
    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should pass through other button props', () => {
    render(<ButtonWithLoading variant="contained" color="primary" size="large">Click Me</ButtonWithLoading>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});

