import type {LucideIcon} from 'lucide-react';
import {MessageCircle, Settings} from 'lucide-react';

export type NavMenuItem = {
    key: string;
    label: string;
    icon: LucideIcon;
};

export const navItems: NavMenuItem[] = [
    {
        key: '/chat',
        label: 'Все',
        icon: MessageCircle,
    },
];

export const settingsItems: NavMenuItem[] = [
    {
        key: '/connection',
        label: 'Настройки',
        icon: Settings,
    },
];