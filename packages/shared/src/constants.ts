export const SHIPPING_FLAT_RATE = 9.99;
export const FREE_SHIPPING_THRESHOLD = 75;

export const ORDER_NUMBER_PREFIX = 'SE';

export const LOW_STOCK_THRESHOLD = 10;

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const CHATBOT_MAX_TOKENS_PER_CONVERSATION = 4096;

export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export const USER_ROLES = ['CUSTOMER', 'ADMIN'] as const;

export const SUPPORTED_CURRENCIES = ['USD'] as const;
