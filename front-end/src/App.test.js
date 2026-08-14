import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('opens the employee portal after employee sign in', () => {
  window.localStorage.clear();
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /employee staff portal access/i }));
  fireEvent.change(screen.getByPlaceholderText('employee@jofiane.com'), {
    target: { value: 'employee@jofiane.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: 'password' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

  expect(screen.getByText('Employee Portal')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /switch to admin view/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /use dark mode/i }));
  expect(document.querySelector('.employee-portal-shell')).toHaveClass('theme-dark');
  expect(window.localStorage.getItem('jofiane-employee-theme')).toBe('dark');
});

test('opens the redesigned admin portal and persists its theme', () => {
  window.localStorage.clear();
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /admin management console/i }));
  fireEvent.change(screen.getByPlaceholderText('admin@jofiane.com'), {
    target: { value: 'admin@jofiane.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: 'password' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

  expect(screen.getByText('Admin Console')).toBeInTheDocument();
  expect(document.querySelector('.admin-portal-shell')).toHaveClass('theme-light');

  fireEvent.click(screen.getByRole('button', { name: /use dark mode/i }));
  expect(document.querySelector('.admin-portal-shell')).toHaveClass('theme-dark');
  expect(window.localStorage.getItem('jofiane-admin-theme')).toBe('dark');
});
