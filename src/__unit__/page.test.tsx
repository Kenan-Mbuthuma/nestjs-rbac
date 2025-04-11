// __tests__/page.test.tsx

import { render, screen } from '@testing-library/react';
import Page from '../app/page';

test('renders homepage heading', () => {
  render(<Page />);
  expect(
    screen.getByRole('heading', { name: /welcome to role-based access control/i })
  ).toBeInTheDocument();
});

