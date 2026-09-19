import {render, screen, within} from '@testing-library/react';
import {MessageList} from './MessageList';

describe('MessageList', () => {
  it('отображает сообщения в переданном порядке', () => {
    render(
      <MessageList
        messages={[
          {id: '1', text: 'First message', time: '20:55', direction: 'incoming'},
          {id: '2', text: 'Second message', time: '20:56', direction: 'outgoing'},
        ]}
      />,
    );

    const log = screen.getByRole('log');
    expect(within(log).getByText('First message')).toBeInTheDocument();
    expect(within(log).getByText('Second message')).toBeInTheDocument();
    expect(log.children[0]).toHaveTextContent('First message');
    expect(log.children[1]).toHaveTextContent('Second message');
  });

  it('показывает пустое состояние без выдуманных сообщений', () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByRole('log')).toHaveTextContent('Нет сообщений');
  });
});
