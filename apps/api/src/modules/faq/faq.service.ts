import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';

/**
 * Business logic for FAQ entries management.
 */
export class FaqService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Returns all active FAQ entries ordered by position (public use).
   */
  async listPublic() {
    return this.prisma.faqEntry.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Returns all FAQ entries (active and inactive) for admin management.
   */
  async listAll() {
    return this.prisma.faqEntry.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Creates a new FAQ entry.
   */
  async createEntry(data: { question: string; answer: string; position?: number; isActive?: boolean }) {
    return this.prisma.faqEntry.create({ data });
  }

  /**
   * Updates an existing FAQ entry.
   *
   * @throws {AppError} 404 if entry not found.
   */
  async updateEntry(
    id: string,
    data: { question?: string; answer?: string; position?: number; isActive?: boolean },
  ) {
    const existing = await this.prisma.faqEntry.findUnique({ where: { id } });
    if (!existing) throw new AppError('FAQ entry not found.', 404);
    return this.prisma.faqEntry.update({ where: { id }, data });
  }

  /**
   * Permanently deletes a FAQ entry.
   *
   * @throws {AppError} 404 if entry not found.
   */
  async deleteEntry(id: string) {
    const existing = await this.prisma.faqEntry.findUnique({ where: { id } });
    if (!existing) throw new AppError('FAQ entry not found.', 404);
    await this.prisma.faqEntry.delete({ where: { id } });
    return { deleted: true };
  }
}
