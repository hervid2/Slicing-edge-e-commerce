import Groq from 'groq-sdk';
import pino from 'pino';
import type { PrismaClient } from '@slicing-edge/db';
import type { ChatbotMessageInput } from '@slicing-edge/shared';

const logger = pino({ name: 'chatbot' });

const SYSTEM_PROMPT = `You are a helpful shopping assistant for Slicing Edge, a premium kitchen knife e-commerce store.
You help customers:
- Find the right knives and kitchen tools for their needs
- Get product recommendations by type or category
- Track their existing orders by order number

Be concise, friendly, and product-focused. When recommending products, use the available tools to fetch real catalog data.
If a customer asks to track an order, ask for their order number (format: SE-XXXXX-XXXXXX) and email if needed.`;

const MODEL = 'llama-3.3-70b-versatile';

/** Groq tool definitions (OpenAI function-calling format). */
const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description:
        'Search for products in the catalog by keyword. Use this when a customer describes what they are looking for.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keyword to match against product name or description',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of products to return (default: 5, max: 10)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_products_by_category',
      description:
        'Get products filtered by category slug. Use this when a customer asks about a specific knife type or category.',
      parameters: {
        type: 'object',
        properties: {
          categorySlug: {
            type: 'string',
            description: 'The category slug to filter by (e.g. "chef-knives", "bread-knives")',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of products to return (default: 5, max: 10)',
          },
        },
        required: ['categorySlug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'track_order',
      description:
        'Look up an order by order number and optional guest email to show the customer their order status.',
      parameters: {
        type: 'object',
        properties: {
          orderNumber: {
            type: 'string',
            description: 'The order number (e.g. SE-ABC123-XYZ789)',
          },
          email: {
            type: 'string',
            description: 'Guest email address used at checkout (required for guest orders)',
          },
        },
        required: ['orderNumber'],
      },
    },
  },
];

/** Shape of a product returned by the chatbot alongside the text reply. */
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

/** Return type of ChatbotService.chat(). */
export interface ChatbotReply {
  reply: string;
  /** Products surfaced by product-search tools during this turn. */
  products: ChatProduct[];
}

export class ChatbotService {
  private client: Groq | null = null;

  constructor(private prisma: PrismaClient) {
    if (process.env.GROQ_API_KEY) {
      this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
  }

  /**
   * Executes a named tool against the database.
   * Returns the raw result and any products to surface to the frontend.
   */
  private async executeTool(
    name: string,
    input: Record<string, unknown>,
  ): Promise<{ result: unknown; products?: ChatProduct[] }> {
    switch (name) {
      case 'search_products': {
        const query = String(input.query ?? '');
        const limit = Math.min(Number(input.limit ?? 5), 10);

        const products = await this.prisma.product.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            avgRating: true,
            reviewCount: true,
            stock: true,
            category: { select: { name: true, slug: true } },
            images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, altText: true } },
          },
          orderBy: { avgRating: 'desc' },
        });

        const chatProducts = products.map((p) => ({
          ...p,
          price: p.price.toString(),
        }));

        return { result: { products: chatProducts }, products: chatProducts };
      }

      case 'get_products_by_category': {
        const categorySlug = String(input.categorySlug ?? '');
        const limit = Math.min(Number(input.limit ?? 5), 10);

        const products = await this.prisma.product.findMany({
          where: {
            isActive: true,
            category: { slug: categorySlug },
          },
          take: limit,
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            avgRating: true,
            reviewCount: true,
            stock: true,
            category: { select: { name: true, slug: true } },
            images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, altText: true } },
          },
          orderBy: { avgRating: 'desc' },
        });

        const chatProducts = products.map((p) => ({
          ...p,
          price: p.price.toString(),
        }));

        return { result: { products: chatProducts }, products: chatProducts };
      }

      case 'track_order': {
        const orderNumber = String(input.orderNumber ?? '');
        const email = input.email ? String(input.email) : undefined;

        const where: { orderNumber: string; guestEmail?: string } = { orderNumber };
        if (email) where.guestEmail = email;

        const order = await this.prisma.order.findFirst({
          where,
          select: {
            orderNumber: true,
            status: true,
            total: true,
            currency: true,
            createdAt: true,
            shippingAddress: true,
            items: {
              select: {
                productName: true,
                productPrice: true,
                quantity: true,
              },
            },
            statusHistory: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { status: true, note: true, createdAt: true },
            },
          },
        });

        if (!order) {
          return {
            result: { error: 'Order not found. Please check the order number and email.' },
          };
        }

        return { result: { order } };
      }

      default:
        return { result: { error: `Unknown tool: ${name}` } };
    }
  }

  /**
   * Sends a user message to the Groq LLM and runs the tool-use agentic loop
   * until a final text response is produced.
   * Returns the reply text and any products surfaced by product-search tools.
   *
   * @param input - Validated chatbot message input with history.
   */
  async chat(input: ChatbotMessageInput): Promise<ChatbotReply> {
    if (!this.client) {
      logger.warn('GROQ_API_KEY is not set — chatbot returning stub response');
      return {
        reply: 'The chatbot is not configured yet. Please contact support.',
        products: [],
      };
    }

    const client = this.client;

    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...input.history.map((h) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user', content: input.message },
      ];

      let response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        tools: TOOLS,
        tool_choice: 'auto',
        messages,
      });

      logger.debug({ finishReason: response.choices[0]?.finish_reason }, 'chatbot initial response');

      const allProducts: ChatProduct[] = [];

      // Agentic tool-use loop
      while (response.choices[0]?.finish_reason === 'tool_calls') {
        const assistantMessage = response.choices[0].message;
        const toolCalls = assistantMessage.tool_calls ?? [];

        messages.push(assistantMessage);

        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          let toolInput: Record<string, unknown> = {};

          try {
            toolInput = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
          } catch {
            logger.warn({ tool: toolName }, 'failed to parse tool arguments');
          }

          logger.info({ tool: toolName, input: toolInput }, 'chatbot executing tool');

          try {
            const { result, products } = await this.executeTool(toolName, toolInput);
            if (products) allProducts.push(...products);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          } catch (err) {
            logger.error({ tool: toolName, err }, 'chatbot tool execution failed');
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: 'Tool execution failed. Please try again.' }),
            });
          }
        }

        response = await client.chat.completions.create({
          model: MODEL,
          max_tokens: 1024,
          tools: TOOLS,
          tool_choice: 'auto',
          messages,
        });

        logger.debug(
          { finishReason: response.choices[0]?.finish_reason },
          'chatbot tool-use loop response',
        );
      }

      const reply =
        response.choices[0]?.message?.content ??
        'I could not generate a response. Please try again.';

      return { reply, products: allProducts };
    } catch (err) {
      // When the model fails to generate a valid tool call, retry without tools
      const isToolUseFailed =
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        (err as { status: number }).status === 400 &&
        JSON.stringify(err).includes('tool_use_failed');

      if (isToolUseFailed) {
        logger.warn({ err }, 'chatbot tool_use_failed — retrying without tools');
        try {
          const fallback = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 1024,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...input.history.map((h) => ({
                role: h.role as 'user' | 'assistant',
                content: h.content,
              })),
              { role: 'user', content: input.message },
            ],
          });
          return {
            reply:
              fallback.choices[0]?.message?.content ??
              'I could not generate a response. Please try again.',
            products: [],
          };
        } catch (fallbackErr) {
          logger.error({ fallbackErr }, 'chatbot fallback without tools also failed');
        }
      } else {
        logger.error({ err }, 'chatbot Groq API call failed');
      }

      return {
        reply: 'Sorry, the assistant is temporarily unavailable. Please try again later.',
        products: [],
      };
    }
  }
}
