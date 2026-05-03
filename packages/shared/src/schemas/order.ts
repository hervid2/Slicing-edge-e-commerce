import { z } from 'zod';

export const checkoutSchema = z.object({
  addressId: z.string().cuid().optional(),
  guestEmail: z.string().email().optional(),
  shippingAddress: z
    .object({
      fullName: z.string().min(2),
      street: z.string().min(5),
      city: z.string().min(2),
      state: z.string().min(2),
      zipCode: z.string().min(3),
      country: z.string().default('US'),
      phone: z.string().optional(),
    })
    .optional(),
});

export const guestOrderTrackingSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  email: z.string().email('Invalid email address'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().optional(),
  trackingNumber: z.string().max(100).optional(),
  carrierName: z.string().max(80).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type GuestOrderTrackingInput = z.infer<typeof guestOrderTrackingSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
