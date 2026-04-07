import Anthropic from '@anthropic-ai/sdk';
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

/** Anthropic tool definitions for the chatbot agentic loop. */
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_products',
    description:
      'Search for products in the catalog by keyword. Use this when a customer describes what they are looking for.',
    input_schema: {
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
  {
    name: 'get_products_by_category',
    description:
      'Get products filtered by category slug. Use this when a customer asks about a specific knife type or category.',
    input_schema: {
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
  {
    name: 'track_order',
    description:
      'Look up an order by order number and optional guest email to show the customer their order status.',
    input_schema: {
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
];

export class ChatbotService {
  private client: Anthropic;

  constructor(private prisma: PrismaClient) {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Executes a named tool against the database and returns a serializable result.
   */
  private async executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
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

        return { products };
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

        return { products };
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
          return { error: 'Order not found. Please check the order number and email.' };
        }

        return { order };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  /**
   * Sends a user message to the Anthropic Claude chatbot and runs the tool-use
   * agentic loop until a final text response is produced.
   *
   * @param input - Validated chatbot message input with history.
   * @returns The assistant's final text reply.
   */
  async chat(input: ChatbotMessageInput): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY is not set — chatbot returning stub response');
      return 'The chatbot is not configured yet. Please contact support.';
    }

    const messages: Anthropic.MessageParam[] = [
      ...input.history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: input.message },
    ];

    let response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    logger.debug({ stopReason: response.stop_reason }, 'chatbot initial response');

    // Agentic tool-use loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        logger.info({ tool: toolUse.name, input: toolUse.input }, 'chatbot executing tool');

        try {
          const result = await this.executeTool(toolUse.name, toolUse.input as Record<string, unknown>);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          logger.error({ tool: toolUse.name, err }, 'chatbot tool execution failed');
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: 'Tool execution failed. Please try again.' }),
            is_error: true,
          });
        }
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });

      response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });

      logger.debug({ stopReason: response.stop_reason }, 'chatbot tool-use loop response');
    }

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    return textBlock?.text ?? 'I could not generate a response. Please try again.';
  }
}
