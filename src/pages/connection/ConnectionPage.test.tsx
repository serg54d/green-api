import {render, screen} from '@testing-library/react';

import {ConnectionPage} from './index';

describe('ConnectionPage', () => {
  it('renders the page', () => {
    render(<ConnectionPage />);

    expect(screen.getByRole('heading', {name: 'MAX Chat', level: 1})).toBeInTheDocument();
  });
});
