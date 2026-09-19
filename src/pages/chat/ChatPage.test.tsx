import {act, createEvent, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ChatPage} from './index';
import {chatApi, type CheckAccountResponse} from './api/chatApi';
import {ChatContext} from './store/ChatContext';
import {ChatStore} from './store/ChatStore';

jest.mock('@/shared/auth/api/authApi', () => ({authApi: {getStateInstance: jest.fn()}}));
jest.mock('./api/chatApi', () => ({chatApi: {checkAccount: jest.fn()}}));

const credentials = {idInstance: '123', apiTokenInstance: 'test-token'};

function renderPage(store = new ChatStore(() => credentials)) {
  return {
    ...render(
      <ChatContext.Provider value={store}>
        <ChatPage />
      </ChatContext.Provider>,
    ),
    store,
  };
}

describe('ChatPage', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  beforeEach(() => {
    jest.mocked(chatApi.checkAccount).mockReset();
  });

  it('показывает пустые состояния без выдуманных чатов и формы сообщения', () => {
    renderPage();
    expect(screen.getByRole('heading', {name: 'Чаты'})).toBeInTheDocument();
    expect(screen.getByText('Нет чатов')).toBeInTheDocument();
    expect(screen.getByText('Выберите чат')).toBeInTheDocument();
    expect(screen.queryByLabelText('Сообщение')).not.toBeInTheDocument();
  });

  it('создаёт и выбирает чат через форму номера', async () => {
    const user = userEvent.setup();
    jest
      .mocked(chatApi.checkAccount)
      .mockResolvedValue({exist: true, chatId: '1', fromCache: false});
    const {store} = renderPage();
    await user.click(screen.getByRole('button', {name: 'Новый чат'}));
    await user.type(screen.getByLabelText('Номер телефона'), '+7 (999) 123-45-67');
    await user.click(screen.getByRole('button', {name: 'Добавить'}));
    await waitFor(() => expect(store.activeChatId).toBe('1'));
    expect(screen.getByRole('log')).toHaveTextContent('Нет сообщений');
    expect(screen.getByLabelText('Сообщение')).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Отправить сообщение'})).toBeDisabled();
  });

  it('переключает переписку и размещает форму сообщения вне списка сообщений', async () => {
    const user = userEvent.setup();
    jest
      .mocked(chatApi.checkAccount)
      .mockResolvedValueOnce({exist: true, chatId: '1', fromCache: false})
      .mockResolvedValueOnce({exist: true, chatId: '2', fromCache: false});
    const store = new ChatStore(() => credentials);
    await store.createChat('79991234567');
    await store.createChat('79997654321');
    act(() => {
      store.chats[0].messages.push({
        id: 'm1',
        text: 'Первый чат',
        time: '12:00',
        direction: 'incoming',
      });
      store.chats[1].messages.push({
        id: 'm2',
        text: 'Второй чат',
        time: '12:01',
        direction: 'incoming',
      });
    });
    renderPage(store);
    expect(within(screen.getByRole('log')).getByText('Второй чат')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: /79991234567/}));
    const log = screen.getByRole('log');
    expect(within(log).getByText('Первый чат')).toBeInTheDocument();
    expect(within(log).queryByText('Второй чат')).not.toBeInTheDocument();
    expect(log).not.toContainElement(screen.getByLabelText('Сообщение'));
    const form = screen.getByLabelText('Сообщение').closest('form')!;
    const event = createEvent.submit(form);
    fireEvent(form, event);
    expect(event.defaultPrevented).toBe(true);
  });

  it.each(['close', 'unmount'])(
    'отменяет создание при действии %s и игнорирует поздний ответ',
    async (mode) => {
      const user = userEvent.setup();
      let resolve!: (response: CheckAccountResponse) => void;
      jest.mocked(chatApi.checkAccount).mockImplementation(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
      const {store, unmount} = renderPage();
      await user.click(screen.getByRole('button', {name: 'Новый чат'}));
      await user.type(screen.getByLabelText('Номер телефона'), '79991234567');
      await user.click(screen.getByRole('button', {name: 'Добавить'}));
      await waitFor(() => expect(store.isCreating).toBe(true));
      const signal = jest.mocked(chatApi.checkAccount).mock.calls[0][2];
      if (mode === 'close') await user.click(screen.getByRole('button', {name: 'Отмена'}));
      else unmount();
      expect(signal?.aborted).toBe(true);
      await act(async () => {
        resolve({exist: true, chatId: 'late', fromCache: false});
      });
      expect(store.chats).toHaveLength(0);
      expect(store.isCreating).toBe(false);
    },
  );
});
