import { http } from './http';

export const authApi = {
  register: (payload) => http('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => http('/auth/login', { method: 'POST', body: payload }),
  me: () => http('/auth/me'),
};
