const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ChatProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  avgRating: number;
  reviewCount: number;
  stock: number;
  category: { name: string; slug: string };
  images: Array<{ url: string; altText: string | null }>;
}

export interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotResponse {
  reply: string;
  products: ChatProduct[];
}

/**
 * Sends a message to the AI chatbot and returns the reply + any surfaced products.
 */
export async function sendChatMessage(
  message: string,
  history: ChatHistoryEntry[],
): Promise<ChatbotResponse> {
  const res = await fetch(`${API_URL}/api/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Chatbot request failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<ChatbotResponse>;
}
