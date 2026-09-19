'use client';

import {createContext} from 'react';
import type {ChatStore} from './ChatStore';

export const ChatContext = createContext<ChatStore | null>(null);
