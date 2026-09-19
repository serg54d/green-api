import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {AuthProvider} from '@/shared/auth';

import {ConnectionPage} from './index';
import {authApi} from '@/shared/auth/api/authApi';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({useRouter: () => ({replace: mockReplace})}));
jest.mock('@/shared/auth/api/authApi', () => ({authApi: {getStateInstance: jest.fn()}}));
const mockGetState = jest.mocked(authApi.getStateInstance);

describe('ConnectionPage', () => {
  it('открывает пункт настроек и возвращается назад без потери введённых данных', async () => {
    const user = userEvent.setup();
    const {container} = render(<ConnectionPage />, {wrapper: AuthProvider});
    const root = container.firstElementChild;
    expect(root).not.toHaveClass('mobileContentOpen');
    await user.click(screen.getByRole('button', {name: 'Вход'}));
    expect(root).toHaveClass('mobileContentOpen');
    await user.type(screen.getByPlaceholderText('idInstance'), '123');
    await user.click(screen.getByRole('button', {name: 'Назад к настройкам'}));
    expect(root).not.toHaveClass('mobileContentOpen');
    await user.click(screen.getByRole('button', {name: 'Вход'}));
    expect(screen.getByPlaceholderText('idInstance')).toHaveValue('123');
    expect(mockGetState).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    mockReplace.mockReset();
    mockGetState.mockReset();
    mockGetState.mockResolvedValue({stateInstance: 'authorized'});
  });
  it('отображает страницу подключения', () => {
    render(<ConnectionPage />, {wrapper: AuthProvider});

    expect(screen.getByRole('heading', {name: 'Настройки', level: 1})).toBeInTheDocument();
    expect(screen.getByPlaceholderText('idInstance')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('apiTokenInstance')).toBeInTheDocument();
  });

  it('обновляет страницу при подключении и выходе через общий провайдер', async () => {
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

  it('проверяет поля перед вызовом API', async () => {
    const user = userEvent.setup();
    render(<ConnectionPage />, {wrapper: AuthProvider});
    await user.click(screen.getByRole('button', {name: 'Войти'}));
    expect(await screen.findByText('Введите idInstance')).toBeInTheDocument();
    expect(screen.getByText('Введите apiTokenInstance')).toBeInTheDocument();
    expect(mockGetState).not.toHaveBeenCalled();
  });

  it('предлагает личный кабинет для неавторизованного инстанса и позволяет повторить подключение', async () => {
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
    'не предлагает авторизацию инстанса при ошибке %s',
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
