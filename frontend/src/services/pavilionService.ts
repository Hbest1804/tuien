import api from '../lib/axios';

export interface PavilionItem {
  itemId: string;
  name: string;
  type: string;
  subType: string;
  description: string;
  effectDesc?: string;
  rarity: string;
  price: number;
}

export interface PavilionResponse {
  items: PavilionItem[];
}

export interface ExchangeResponse {
  message: string;
  remainingContribution: number;
}

export const getPavilionItems = () => 
  api.get<PavilionResponse>('/pavilion');

export const exchangePavilionItem = (itemId: string) => 
  api.post<ExchangeResponse>('/pavilion/exchange', { itemId });
