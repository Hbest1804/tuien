import api from '../lib/axios';

export interface AuctionListing {
  _id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  itemName: string;
  itemRarity: string;
  itemType: string;
  quantity: number;
  startingPrice: number;
  currentBid: number;
  buyoutPrice: number | null;
  bidderId: string | null;
  bidderName: string | null;
  status: 'active' | 'sold' | 'expired' | 'cancelled' | 'pending_claim';
  expiresAt: string;
  sellerClaimed: boolean;
  buyerClaimed: boolean;
  createdAt: string;
}

export interface ListingsResponse {
  listings: AuctionListing[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MyListingsResponse {
  selling: AuctionListing[];
  bidding: AuctionListing[];
}

export interface ListItemPayload {
  itemId: string;
  quantity: number;
  startingPrice: number;
  buyoutPrice?: number | null;
  durationHours: 12 | 24 | 48;
}

export const getAuctionListings = (params?: {
  itemType?: string;
  rarity?: string;
  name?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => api.get<ListingsResponse>('/auction', { params });

export const getMyAuctionListings = () =>
  api.get<MyListingsResponse>('/auction/my');

export const listAuctionItem = (payload: ListItemPayload) =>
  api.post<{ message: string; listing: AuctionListing }>('/auction/list', payload);

export const placeBid = (listingId: string, bidAmount: number) =>
  api.post<{ message: string; spiritStones: number; listing: AuctionListing }>(
    '/auction/bid',
    { listingId, bidAmount }
  );

export const buyoutListing = (listingId: string) =>
  api.post<{ message: string; spiritStones: number; listing: AuctionListing }>(
    '/auction/buyout',
    { listingId }
  );

export const claimAuctionListing = (listingId: string) =>
  api.post<{ message: string; spiritStones: number; listing: AuctionListing }>(
    '/auction/claim',
    { listingId }
  );

export const cancelAuctionListing = (listingId: string) =>
  api.delete<{ message: string; listing: AuctionListing }>(`/auction/${listingId}`);
