import '@testing-library/jest-dom';

// JSDOM не рассчитывает размеры, но Ant Design подписывается на их изменения.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
