import {render, screen, within} from '@testing-library/react';
import {MessageList} from './MessageList';

describe('MessageList', () => {
  it('renders messages in the supplied order', () => {
    render(
      <MessageList
        messages={[
          {id: 1, text: 'First message', time: '20:55'},
          {id: 2, text: 'Second message', time: '20:56'},
        ]}
      />,
    );

    const log = screen.getByRole('log');
    expect(within(log).getByText('First message')).toBeInTheDocument();
    expect(within(log).getByText('Second message')).toBeInTheDocument();
    expect(log.children[0]).toHaveTextContent('First message');
    expect(log.children[1]).toHaveTextContent('Second message');
  });

  it('does not render mock messages for an empty conversation', () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByRole('log')).toBeEmptyDOMElement();
  });
});
