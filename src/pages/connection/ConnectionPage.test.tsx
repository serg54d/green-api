import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {AuthProvider} from '@/shared/auth';

import {ConnectionPage} from './index';
import {authApi} from '@/shared/api/green-api/authApi';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({useRouter: () => ({replace: mockReplace})}));
jest.mock('@/shared/api/green-api/authApi', () => ({authApi: {getStateInstance: jest.fn()}}));
const mockGetState = jest.mocked(authApi.getStateInstance);

describe('ConnectionPage', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockGetState.mockReset();
    mockGetState.mockResolvedValue({stateInstance: 'authorized'});
  });
  it('renders the page', () => {
    render(<ConnectionPage />, {wrapper: AuthProvider});

    expect(screen.getByRole('heading', {name: 'Настройки', level: 1})).toBeInTheDocument();
    expect(screen.getByPlaceholderText('idInstance')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('apiTokenInstance')).toBeInTheDocument();
  });

  it('updates the page on connect and logout through the shared provider', async () => {
    const user = userEvent.setup();
    render(<ConnectionPage />, {wrapper: AuthProvider});

    await user.type(screen.getByPlaceholderText('idInstance'), '123');
    await user.type(screen.getByPlaceholderText('apiTokenInstance'), 'test-token');
    await user.click(screen.getByRole('button', {name: 'Войти'}));

    expect(await screen.findByRole('heading', {name: 'Вы авторизованы'})).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/chat');
    expect(screen.queryByPlaceholderText('idInstance')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Выйти'}));

    expect(screen.getByPlaceholderText('idInstance')).toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: 'Вы авторизованы'})).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/connection');
    expect(screen.getByPlaceholderText('apiTokenInstance')).toHaveValue('');
  });

  it('validates fields before calling the API', async () => {
    const user = userEvent.setup();
    render(<ConnectionPage />, {wrapper: AuthProvider});
    await user.click(screen.getByRole('button', {name: 'Войти'}));
    expect(await screen.findByText('Введите idInstance')).toBeInTheDocument();
    expect(screen.getByText('Введите apiTokenInstance')).toBeInTheDocument();
    expect(mockGetState).not.toHaveBeenCalled();
  });

  it('offers the console for an unauthorized instance and allows retrying', async () => {
    mockGetState.mockResolvedValue({stateInstance: 'notAuthorized'});
    const user = userEvent.setup();
    render(<ConnectionPage />, {wrapper: AuthProvider});
    await user.type(screen.getByPlaceholderText('idInstance'), '123');
    await user.type(screen.getByPlaceholderText('apiTokenInstance'), 'test-token');
    await user.click(screen.getByRole('button', {name: 'Войти'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Инстанс не авторизован');
    const link = screen.getByRole('link', {name: 'Открыть GREEN-API'});
    expect(link).toHaveAttribute('href', 'https://console.green-api.com/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await waitFor(() => expect(screen.getByRole('button', {name: 'Войти'})).toBeEnabled());
    expect(mockReplace).not.toHaveBeenCalled();
    mockGetState.mockResolvedValue({stateInstance: 'authorized'});
    await user.click(screen.getByRole('button', {name: 'Войти'}));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/chat'));
    expect(mockGetState).toHaveBeenLastCalledWith(
      {idInstance: '123', apiTokenInstance: 'test-token'},
      expect.any(AbortSignal),
    );
    expect(screen.queryByRole('link', {name: 'Открыть GREEN-API'})).not.toBeInTheDocument();
  });

  it.each(['starting', 'blocked', 'network', 'invalid-token'])(
    'does not offer instance authorization for %s',
    async (reason) => {
      if (reason === 'network') mockGetState.mockRejectedValue(new Error('Network error'));
      else if (reason === 'invalid-token') {
        mockGetState.mockRejectedValue({isAxiosError: true, response: {status: 401}});
      } else mockGetState.mockResolvedValue({stateInstance: reason});
      const user = userEvent.setup();
      render(<ConnectionPage />, {wrapper: AuthProvider});
      await user.type(screen.getByPlaceholderText('idInstance'), '123');
      await user.type(screen.getByPlaceholderText('apiTokenInstance'), 'test-token');
      await user.click(screen.getByRole('button', {name: 'Войти'}));
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.queryByRole('link', {name: 'Открыть GREEN-API'})).not.toBeInTheDocument();
    },
  );
});
