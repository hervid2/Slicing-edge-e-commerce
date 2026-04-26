import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';

/**
 * Business logic for contact form messages.
 */
export class ContactService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Persists a contact form submission.
   */
  async createMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return this.prisma.contactMessage.create({ data });
  }

  /**
   * Returns a paginated list of contact messages for admin review.
   * Supports filtering by read/unread status.
   */
  async listMessages(page: number, limit: number, unreadOnly?: boolean) {
    const skip = (page - 1) * limit;
    const where = unreadOnly ? { isRead: false } : {};

    const [messages, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Marks a contact message as read.
   *
   * @throws {AppError} 404 if message not found.
   */
  async markRead(id: string) {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new AppError('Message not found.', 404);
    return this.prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
  }

  /**
   * Permanently deletes a contact message.
   *
   * @throws {AppError} 404 if message not found.
   */
  async deleteMessage(id: string) {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new AppError('Message not found.', 404);
    await this.prisma.contactMessage.delete({ where: { id } });
    return { deleted: true };
  }
}
