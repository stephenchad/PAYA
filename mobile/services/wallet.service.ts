import { api } from './api';

export const walletApi = {
  getBalance: () => api.get('/wallet/balance').then((r) => r.data),
  fund: (amountKobo: number, note?: string) =>
    api.post('/wallet/fund', { amount: amountKobo, note }).then((r) => r.data),
  send: (recipient: string, amountKobo: number, note?: string) =>
    api.post('/wallet/send', { recipient, amount: amountKobo, note }).then((r) => r.data),
  history: (limit = 20, offset = 0) =>
    api.get('/wallet/transactions', { params: { limit, offset } }).then((r) => r.data),
};