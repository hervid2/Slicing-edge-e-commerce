import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ──── Admin User ────
  const adminPasswordHash = await hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@slicing-edge.com' },
    update: {},
    create: {
      email: 'admin@slicing-edge.com',
      name: 'Admin',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log(`  ✅ Admin user: ${admin.email}`);

  // ──── Test Customer ────
  const customerPasswordHash = await hash('customer123456', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'John Doe',
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
      emailVerified: new Date(),
    },
  });
  console.log(`  ✅ Customer user: ${customer.email}`);

  // ──── Categories ────
  const categories = [
    {
      name: "Chef's Knives",
      slug: 'chef-knives',
      description: 'Versatile all-purpose knives for professional and home chefs.',
      position: 1,
    },
    {
      name: 'Santoku Knives',
      slug: 'santoku-knives',
      description: 'Japanese-style knives perfect for slicing, dicing, and mincing.',
      position: 2,
    },
    {
      name: 'Paring Knives',
      slug: 'paring-knives',
      description: 'Small, precise knives for peeling and intricate cutting tasks.',
      position: 3,
    },
    {
      name: 'Bread Knives',
      slug: 'bread-knives',
      description: 'Serrated knives designed for slicing through crusty breads.',
      position: 4,
    },
    {
      name: 'Fillet Knives',
      slug: 'fillet-knives',
      description: 'Flexible blades ideal for deboning fish and meat.',
      position: 5,
    },
    {
      name: 'Cleaver',
      slug: 'cleaver',
      description: 'Heavy-duty knives for chopping through bones and tough ingredients.',
      position: 6,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✅ ${categories.length} categories created`);

  // ──── Products ────
  const chefCategory = await prisma.category.findUnique({ where: { slug: 'chef-knives' } });
  const santokuCategory = await prisma.category.findUnique({ where: { slug: 'santoku-knives' } });
  const paringCategory = await prisma.category.findUnique({ where: { slug: 'paring-knives' } });
  const breadCategory = await prisma.category.findUnique({ where: { slug: 'bread-knives' } });
  const filletCategory = await prisma.category.findUnique({ where: { slug: 'fillet-knives' } });
  const cleaverCategory = await prisma.category.findUnique({ where: { slug: 'cleaver' } });

  if (
    !chefCategory ||
    !santokuCategory ||
    !paringCategory ||
    !breadCategory ||
    !filletCategory ||
    !cleaverCategory
  ) {
    throw new Error('Categories not found');
  }

  const products = [
    {
      name: 'Classic Chef Knife 8"',
      slug: 'classic-chef-knife-8-inch',
      description:
        'Our flagship 8-inch chef knife, forged from high-carbon German steel with a full tang construction. The ergonomic handle provides perfect balance and comfort during extended use. Ideal for chopping, slicing, and dicing vegetables, herbs, and proteins.',
      price: 129.99,
      compareAtPrice: 159.99,
      stock: 45,
      categoryId: chefCategory.id,
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Pro Chef Knife 10"',
      slug: 'pro-chef-knife-10-inch',
      description:
        'A professional-grade 10-inch chef knife with a Damascus steel blade featuring 67 layers. The VG-10 steel core ensures exceptional edge retention. The pakkawood handle is both beautiful and durable.',
      price: 249.99,
      stock: 20,
      categoryId: chefCategory.id,
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Santoku Knife 7"',
      slug: 'santoku-knife-7-inch',
      description:
        'A beautifully crafted 7-inch Santoku knife with a Granton edge to prevent food from sticking to the blade. Made from Japanese AUS-10 steel, hand-sharpened to a 15-degree angle per side.',
      price: 89.99,
      compareAtPrice: 109.99,
      stock: 60,
      categoryId: santokuCategory.id,
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Mini Santoku 5"',
      slug: 'mini-santoku-5-inch',
      description:
        'A compact 5-inch Santoku knife, perfect for smaller hands or quick prep work. The same premium AUS-10 steel as its larger sibling, with an ultra-sharp edge.',
      price: 64.99,
      stock: 35,
      categoryId: santokuCategory.id,
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Precision Paring Knife 3.5"',
      slug: 'precision-paring-knife-3-5-inch',
      description:
        'A razor-sharp 3.5-inch paring knife for detailed work like peeling, trimming, and creating garnishes. High-carbon stainless steel blade with a comfortable non-slip grip.',
      price: 39.99,
      stock: 80,
      categoryId: paringCategory.id,
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: "Bird's Beak Paring Knife 2.5\"",
      slug: 'birds-beak-paring-knife-2-5-inch',
      description:
        "A curved bird's beak blade ideal for turning vegetables, creating decorative cuts, and peeling round fruits. Forged from a single piece of high-carbon steel.",
      price: 34.99,
      stock: 50,
      categoryId: paringCategory.id,
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Artisan Bread Knife 9"',
      slug: 'artisan-bread-knife-9-inch',
      description:
        'A 9-inch serrated bread knife with deep, pointed serrations that grip and cut through the crustiest artisan loaves without crushing the soft interior. Also excellent for slicing tomatoes and citrus.',
      price: 59.99,
      stock: 40,
      categoryId: breadCategory.id,
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Flexible Fillet Knife 7"',
      slug: 'flexible-fillet-knife-7-inch',
      description:
        'A 7-inch fillet knife with a thin, flexible blade that follows the contours of fish bones with precision. The Swedish Sandvik steel blade offers superior corrosion resistance for wet environments.',
      price: 74.99,
      stock: 30,
      categoryId: filletCategory.id,
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Heavy Duty Meat Cleaver 7"',
      slug: 'heavy-duty-meat-cleaver-7-inch',
      description:
        'A robust 7-inch cleaver with a thick, heavy blade designed for splitting bones and tough cuts of meat. The full-tang construction and weighted balance make chopping effortless.',
      price: 99.99,
      compareAtPrice: 129.99,
      stock: 25,
      categoryId: cleaverCategory.id,
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: 'Chinese Vegetable Cleaver 8"',
      slug: 'chinese-vegetable-cleaver-8-inch',
      description:
        'A lighter 8-inch Chinese-style cleaver with a thinner blade, perfect for rapid vegetable prep. The wide blade doubles as a scoop to transfer ingredients from cutting board to wok.',
      price: 84.99,
      stock: 35,
      categoryId: cleaverCategory.id,
      isActive: true,
      publishedAt: new Date(),
    },
  ];

  // Production-quality images sourced from Pexels (free for commercial use, CC0).
  // The classic chef knife retains its original Unsplash photo.
  // Replace cloudinaryPublicId values with your own Cloudinary public IDs after
  // uploading images via the admin upload endpoint (/api/admin/upload).
  const seedImageBySlug: Record<
    string,
    { url: string; publicId: string; altText: string }
  > = {
    'classic-chef-knife-8-inch': {
      // Unsplash — verified working
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&q=80',
      publicId: 'seed/classic-chef-knife-8-inch',
      altText: 'Classic Chef Knife 8 inch on a wooden cutting board',
    },
    'pro-chef-knife-10-inch': {
      // Pexels 16603814 — Japanese artisan Damascus-style knives on dark background
      url: 'https://images.pexels.com/photos/16603814/pexels-photo-16603814.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      publicId: 'seed/pro-chef-knife-10-inch',
      altText: 'Professional Chef Knife 10 inch with Damascus steel blade',
    },
    'santoku-knife-7-inch': {
      // Pexels 16457318 — Damascus steel santoku knife on wicker surface
      url: 'https://images.pexels.com/photos/16457318/pexels-photo-16457318.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      publicId: 'seed/santoku-knife-7-inch',
      altText: 'Japanese Santoku Knife 7 inch with Damascus steel blade',
    },
    'mini-santoku-5-inch': {
      // Pexels 4226864 — Clean kitchen knife on white surface (minimalist)
      url: 'https://images.pexels.com/photos/4226864/pexels-photo-4226864.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      publicId: 'seed/mini-santoku-5-inch',
      altText: 'Compact Mini Santoku Knife 5 inch on white surface',
    },
    'precision-paring-knife-3-5-inch': {
      // Pexels 16203855 — Close-up of knife cutting fresh tomatoes
      url: 'https://images.pexels.com/photos/16203855/pexels-photo-16203855.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      publicId: 'seed/precision-paring-knife-3-5-inch',
      altText: 'Precision Paring Knife 3.5 inch slicing tomatoes',
    },
    'birds-beak-paring-knife-2-5-inch': {
      // Pexels 6077638 — Knife with sliced vegetables on wooden board
      url: 'https://images.pexels.com/photos/6077638/pexels-photo-6077638.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      publicId: 'seed/birds-beak-paring-knife-2-5-inch',
      altText: "Bird's Beak Paring Knife 2.5 inch with curved blade",
    },
    'artisan-bread-knife-9-inch': {
      // Pexels 7604435 — Serrated bread knife on wooden cutting board with loaf
      url: 'https://images.pexels.com/photos/7604435/pexels-photo-7604435.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      publicId: 'seed/artisan-bread-knife-9-inch',
      altText: 'Artisan Bread Knife 9 inch with serrated edge slicing bread',
    },
    'flexible-fillet-knife-7-inch': {
      // Pexels 3296395 — Chef slicing fresh tuna fillet on wooden board
      url: 'https://images.pexels.com/photos/3296395/pexels-photo-3296395.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      publicId: 'seed/flexible-fillet-knife-7-inch',
      altText: 'Flexible Fillet Knife 7 inch slicing fresh fish',
    },
    'heavy-duty-meat-cleaver-7-inch': {
      // Pexels 31647676 — Butcher chopping raw meat at market table
      url: 'https://images.pexels.com/photos/31647676/pexels-photo-31647676.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      publicId: 'seed/heavy-duty-meat-cleaver-7-inch',
      altText: 'Heavy Duty Meat Cleaver 7 inch chopping meat',
    },
    'chinese-vegetable-cleaver-8-inch': {
      // Pexels 952478 — Chef knife on slate cutting board with fresh vegetables
      url: 'https://images.pexels.com/photos/952478/pexels-photo-952478.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      publicId: 'seed/chinese-vegetable-cleaver-8-inch',
      altText: 'Chinese Vegetable Cleaver 8 inch for rapid vegetable prep',
    },
  };

  for (const product of products) {
    const createdProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });

    const image = seedImageBySlug[product.slug] || {
      url: defaultImageUrl,
      publicId: `seed/${product.slug}`,
      altText: product.name,
    };

    const existingPrimaryImage = await prisma.productImage.findFirst({
      where: {
        productId: createdProduct.id,
        position: 0,
      },
    });

    if (existingPrimaryImage) {
      await prisma.productImage.update({
        where: { id: existingPrimaryImage.id },
        data: {
          url: image.url,
          cloudinaryPublicId: image.publicId,
          altText: image.altText,
        },
      });
    } else {
      await prisma.productImage.create({
        data: {
          productId: createdProduct.id,
          url: image.url,
          cloudinaryPublicId: image.publicId,
          altText: image.altText,
          position: 0,
        },
      });
    }
  }
  console.log(`  ✅ ${products.length} products created`);
  console.log(`  ✅ ${products.length} primary product images upserted`);



  // ──── Customer Address ────
  await prisma.address.upsert({
    where: { id: 'seed-address-1' },
    update: {},
    create: {
      id: 'seed-address-1',
      userId: customer.id,
      label: 'Home',
      fullName: 'John Doe',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'US',
      phone: '+14155551234',
      isDefault: true,
    },
  });
  console.log('  ✅ Customer address created');

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
