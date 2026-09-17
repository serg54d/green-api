import {render, screen} from '@testing-library/react';

import {ChatPage} from './index';

describe('ChatPage', () => {
  it('renders chat layout', () => {
    render(<ChatPage />);

    expect(
        screen.getByRole('heading', {
          name: 'Чаты',
          level: 1,
        }),
    ).toBeInTheDocument();

    expect(screen.getByText('Настройки')).toBeInTheDocument();
    expect(screen.getByLabelText('Сообщение')).toBeInTheDocument();
  });
});