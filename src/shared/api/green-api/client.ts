import axios from 'axios';
import {env} from '@/shared/config/env';

export const greenApiClient = axios.create({
  baseURL: env.greenApiUrl,
  timeout: 20_000,
});
