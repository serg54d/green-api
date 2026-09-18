import {createEvent, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

    expect(screen.getByRole('button', {name: 'Новый чат'})).toBeInTheDocument();
    expect(screen.getByLabelText('Сообщение')).toBeInTheDocument();
  });

  it('prevents native form submission', () => {
    render(<ChatPage />);
    const form = screen.getByLabelText('Сообщение').closest('form')!;
    const event = createEvent.submit(form);

    fireEvent(form, event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('keeps the composer outside the scrolling conversation', () => {
    render(<ChatPage />);

    const conversation = screen.getByRole('log', {name: 'Переписка'});
    expect(conversation).toHaveTextContent('Привет');
    expect(conversation).not.toContainElement(screen.getByLabelText('Сообщение'));
  });

  it.each(['enter', 'click'])('prevents navigation on %s', async method => {
    const user = userEvent.setup();
    render(<ChatPage />);
    const input = screen.getByLabelText('Сообщение');
    const form = input.closest('form')!;
    const submissions: Event[] = [];
    const onSubmit = (event: Event) => {
      if (event.target === form) submissions.push(event);
    };
    document.addEventListener('submit', onSubmit);

    try {
      await user.type(input, 'Hello');
      if (method === 'enter') {
        await user.keyboard('{Enter}');
      } else {
        await user.click(screen.getByRole('button', {name: 'Отправить сообщение'}));
      }

      expect(submissions).toHaveLength(1);
      expect(submissions[0].defaultPrevented).toBe(true);
      expect(input).toHaveValue('Hello');
    } finally {
      document.removeEventListener('submit', onSubmit);
    }
  });
});
