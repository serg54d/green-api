import * as yup from 'yup';

import {normalizePhoneNumber} from '@/shared/lib/phone';
import {isSupportedPhoneNumber} from './phone';

export const newChatSchema = yup.object({
    phoneNumber: yup
        .string()
        .required('Введите номер телефона')
        .test(
            'phone-characters',
            'Номер содержит недопустимые символы',
            (value) => normalizePhoneNumber(value ?? '') !== null,
        )
        .test(
            'phone-format',
            'Введите номер России или Беларуси',
            (value) => {
                const phoneNumber = normalizePhoneNumber(value ?? '');

                return phoneNumber
                    ? isSupportedPhoneNumber(phoneNumber)
                    : false;
            },
        ),
});

export type NewChatFormValues = yup.InferType<typeof newChatSchema>;
