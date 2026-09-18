import * as yup from 'yup';

export const connectionSchema = yup.object({
  idInstance: yup
    .string()
    .trim()
    .required('Введите idInstance')
    .matches(/^\d+$/, 'idInstance должен содержать только цифры'),
  apiTokenInstance: yup.string().trim().required('Введите apiTokenInstance'),
});

export type ConnectionFormValues = yup.InferType<typeof connectionSchema>;
