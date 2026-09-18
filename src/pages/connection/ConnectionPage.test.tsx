import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {AuthProvider} from '@/shared/auth';

import {ConnectionPage} from './index';

describe('ConnectionPage', () => {
  it('renders the page', () => {
    render(<ConnectionPage />, {wrapper: AuthProvider});

    expect(screen.getByRole('heading', {name: 'Настройки', level: 1})).toBeInTheDocument();
    expect(screen.getByPlaceholderText('idInstance')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('apiTokenInstance')).toBeInTheDocument();
  });

  it('updates the page on login and logout through the shared provider', async () => {
    const user = userEvent.setup();
    render(<ConnectionPage />, {wrapper: AuthProvider});

    await user.type(screen.getByPlaceholderText('idInstance'), '123');
    await user.type(screen.getByPlaceholderText('apiTokenInstance'), 'test-token');
    await user.click(screen.getByRole('button', {name: 'Войти'}));

    expect(screen.getByRole('heading', {name: 'Вы авторизованы'})).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('idInstance')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Выйти'}));

    expect(screen.getByPlaceholderText('idInstance')).toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: 'Вы авторизованы'})).not.toBeInTheDocument();
  });
});
