# Slicing Edge — Roadmap to Production Deploy

Plan de trabajo completo para llevar Slicing Edge desde su estado actual hasta deploy final en Vercel (web) + Railway (API), organizado por semanas y días.

---

## Estado Actual — Lo que ya está construido

### Backend (apps/api) ✅
- Fastify server con CORS, Helmet, rate-limit, Swagger docs
- Auth: register, verify-email, forgot-password, reset-password
- Products: listing con paginación, filtros, detalle por slug
- Categories: listing
- Cart: CRUD completo (guest vía sessionId)
- Checkout: creación de orden, Stripe Checkout Sessions, webhook handling
- Orders: user orders, guest tracking, admin list, admin status update
- Middleware: JWT auth, requireAdmin, optionalAuth
- Logging: Pino estructurado

### Frontend (apps/web) ✅
- Home, Products, Product Detail, Categories, About pages
- Cart page con CRUD completo
- Checkout con formulario guest + redirect a Stripe
- Order tracking (guest por orderNumber + email)
- Auth: Login, Register, Forgot/Reset Password, Error pages
- Auth.js v5 (Credentials + Google OAuth) con JWT strategy
- Admin: Dashboard, Products list, Orders list (read-only)
- Design system completo (CSS vars, Playfair/Inter fonts)
- Layout: Header (con mobile nav), Footer, Cart button
- Zustand cart store con persistencia
- UI components: Button, Card, Input, ProductCard

### Packages ✅
- `packages/db`: Schema Prisma completo, seed con 10 productos
- `packages/shared`: Zod schemas + constants
- `packages/email`: Templates (Welcome, OrderConfirmation, PasswordReset)

---

## Lo que falta — Gap Analysis

| # | Feature / Gap | Prioridad |
|---|--------------|-----------|
| 1 | Emails no conectados (verificación, reset, order confirmation) | Alta |
| 2 | Wishlist: placeholder, sin API ni lógica | Media |
| 3 | Reviews: sin UI de envío ni API routes | Media |
| 4 | Admin CRUD productos (crear/editar/eliminar, Cloudinary upload) | Alta |
| 5 | Admin UI para actualizar status de órdenes | Alta |
| 6 | Admin: usuarios, métricas dashboard | Media |
| 7 | Búsqueda funcional (header search) | Media |
| 8 | Imágenes de producto con Cloudinary | Alta |
| 9 | AI Chatbot (Anthropic Claude) | Baja |
| 10 | Cart merge guest→user al hacer login | Media |
| 11 | Página de perfil/cuenta del usuario | Media |
| 12 | Order history para usuarios autenticados (frontend) | Media |
| 13 | NextAuth SessionProvider en layout | Alta |
| 14 | Checkout pre-fill con datos del usuario logueado | Media |
| 15 | Error boundaries (error.tsx, not-found.tsx, loading.tsx) | Alta |
| 16 | Testing (unit + integration) | Alta |
| 17 | Upstash Redis rate-limiting (reemplazar básico) | Baja |
| 18 | SEO: OG images, sitemap, robots.txt | Media |
| 19 | Accesibilidad WCAG 2.1 AA audit | Media |
| 20 | CI/CD + Deploy (Vercel + Railway) | Alta |

---

## Semana 1 — Fundamentos y Flujo Crítico

### Día 1: Infraestructura de sesión y errores
- [x
] Agregar `SessionProvider` de NextAuth en `layout.tsx` (wrapping `<body>`)
- [x] Crear `app/error.tsx` global (error boundary)
- [x] Crear `app/not-found.tsx` (404 page)
- [x] Crear `app/loading.tsx` (skeleton global)
- [x] Crear `products/loading.tsx` y `products/[slug]/loading.tsx`

### Día 2: Conectar emails transaccionales
- [x] Wiring en `auth.controller.ts`: enviar Welcome email al registrar
- [x] Wiring en `auth.controller.ts`: enviar PasswordReset email al solicitar reset
- [x] Enviar OrderConfirmation email en webhook `checkout.session.completed`
- [x] Smoke test con Resend (o log si no hay API key)

### Día 3: Cloudinary + Imágenes de producto
- [x] Crear módulo `upload` en API: `POST /api/admin/upload` (Cloudinary)
- [x] Actualizar seed para incluir URLs de Cloudinary (o placeholder URLs)
- [x] Configurar `next.config.ts` con dominio de Cloudinary en `images.remotePatterns`
- [x] Verificar que Product Detail y ProductCard rendericen imágenes correctamente

### Día 4: Admin — CRUD de productos
- [x] API: `POST /api/admin/products` (crear producto con imágenes)
- [x] API: `PUT /api/admin/products/:id` (editar producto)
- [x] API: `DELETE /api/admin/products/:id` (soft-delete / deactivate)
- [x] Frontend: `admin/products/new/page.tsx` — formulario de creación
- [x] Frontend: `admin/products/[id]/edit/page.tsx` — formulario de edición

### Día 5: Admin — Gestión de órdenes
- [x] Frontend: Admin orders page con botón/select para cambiar status
- [x] Implementar llamada `PATCH /api/admin/orders/:id/status` desde UI
- [x] Mostrar detalle de orden expandible (items, dirección, timeline)
- [x] Enviar email de notificación cuando orden cambia a SHIPPED

---

## Semana 2 — Features de Usuario

### Día 6: Búsqueda funcional
- [x] API: asegurar que `GET /api/products?search=` funciona con full-text
- [x] Frontend: modal/drawer de búsqueda al hacer click en icono Search
- [x] Implementar búsqueda con debounce y resultados en dropdown
- [x] Página de resultados `/products?search=query`

### Día 7: Reviews — API + UI
- [x] API: `POST /api/products/:id/reviews` (auth required)
- [x] API: `GET /api/products/:id/reviews` (público, paginado)
- [x] API: `DELETE /api/products/:id/reviews/:reviewId` (own review o admin)
- [x] Frontend: formulario de review en Product Detail (estrellas + comentario)
- [x] Actualizar `avgRating` y `reviewCount` al crear/eliminar review

### Día 8: Wishlist — API + UI
- [x] API: `POST /api/wishlist` (auth required, toggle add/remove)
- [x] API: `GET /api/wishlist` (auth required)
- [x] Frontend: botón de wishlist en ProductCard y Product Detail
- [x] Frontend: `/wishlist` page funcional con lista y remove
- [x] Indicador visual de items en wishlist (corazón relleno)

### Día 9: Perfil de usuario + Order history
- [x] Frontend: `/account/page.tsx` — perfil con nombre, email, dirección
- [x] Frontend: `/account/orders/page.tsx` — historial de órdenes autenticado
- [x] API fetch con Bearer token (usar `apiAccessToken` de la sesión)
- [x] Actualizar Header: link a /account cuando hay sesión

### Día 10: Cart merge + Checkout autenticado
- [x] API: endpoint o lógica para merge guest cart → user cart al login
- [x] Frontend: llamar merge después de `signIn` exitoso
- [x] Checkout: pre-fill email y nombre si el usuario está logueado
- [x] Checkout: pre-fill dirección guardada del usuario (si existe)

---

## Semana 3 — Admin Avanzado, Chatbot y Polish

### Día 11: Admin — Dashboard con métricas
- [x] API: `GET /api/admin/metrics` (total orders, revenue, product count, user count)
- [x] Frontend: dashboard con tarjetas de KPIs
- [x] Gráfico simple de órdenes por día (últimos 30 días)
- [x] Lista de órdenes recientes + productos low-stock

### Día 12: Admin — Gestión de usuarios
- [x] API: `GET /api/admin/users` (paginado)
- [x] API: `PATCH /api/admin/users/:id/role` (cambiar rol)
- [x] Frontend: `/admin/users/page.tsx` — tabla de usuarios con rol
- [x] Agregar link en admin dashboard

### Día 13: AI Chatbot — Backend
- [x] Crear módulo `chatbot` en API: `POST /api/chatbot`
- [x] Integrar Anthropic Claude con tool-use pattern
- [x] Tools: buscar productos, recomendar por categoría, rastrear orden
- [x] Rate-limit específico para chatbot endpoint

### Día 14: AI Chatbot — Frontend
- [x] Componente `ChatWidget` flotante (bottom-right)
- [x] UI: burbuja de chat, input, historial de mensajes
- [x] Streaming de respuestas (o polling)
- [x] Mostrar product cards inline cuando el bot recomienda productos

### Día 15: UX Polish
- [x] Skeleton loaders para Products, Cart, Order pages
- [x] Toast notifications (add to cart, wishlist, etc.)
- [x] Animaciones de transición (page transitions, hover effects)
- [x] Empty states mejorados con ilustraciones
- [x] Responsive QA: verificar todas las páginas en mobile/tablet/desktop

---

## Semana 4 — Testing, SEO y Preparación para Deploy

### Día 16: Testing — Backend
- [x] Unit tests para `AuthService` (register, verify, reset)
- [x] Unit tests para `CheckoutService` (createOrder, webhook handling)
- [x] Unit tests para `ProductService` / `ProductRepository`
- [x] Integration tests para rutas principales (health, products, cart, checkout)
- [x] Configurar Vitest (o Jest) en `apps/api`

### Día 17: Testing — Frontend
- [x] Configurar testing con Vitest + React Testing Library en `apps/web`
- [x] Tests para componentes críticos: ProductCard, CartPage, CheckoutPage
- [x] Tests para cart store (Zustand)
- [x] Tests para auth flow (login, register)

### Día 18: SEO y Accesibilidad
- [x] Agregar `sitemap.ts` y `robots.ts` en `apps/web/src/app`
- [x] OG images para Home, Products, Product Detail
- [x] Structured data (JSON-LD) para Product pages
- [x] Audit WCAG 2.1 AA: aria labels, color contrast, focus management
- [x] Lighthouse audit y correcciones (target: 90+ en todas las categorías)

### Día 19: Seguridad y Rate Limiting
- [ ] Migrar rate-limit a Upstash Redis (`@upstash/ratelimit`)
- [ ] Revisar CORS config para producción
- [ ] Sanitizar inputs (XSS prevention)
- [ ] Verificar que no hay API keys expuestas al client
- [ ] Agregar CSP headers apropiados

### Día 20: Configuración de deploy
- [ ] Crear `Dockerfile` o config para Railway (API)
- [ ] Configurar `vercel.json` si es necesario (web)
- [ ] Configurar variables de entorno en Railway + Vercel
- [ ] Configurar PostgreSQL de producción (Railway o Neon)
- [ ] `prisma migrate deploy` para producción
- [ ] Seed de producción (categorías + productos con imágenes reales)

---

## Semana 5 — Deploy y Lanzamiento

### Día 21: Deploy staging
- [ ] Deploy API a Railway (staging)
- [ ] Deploy Web a Vercel (staging)
- [ ] Configurar dominio custom (si aplica)
- [ ] Verificar Stripe webhooks apuntando a URL de producción
- [ ] Smoke test end-to-end en staging

### Día 22: QA final
- [ ] Flujo completo guest: browse → cart → checkout → payment → tracking
- [ ] Flujo completo authenticated: register → login → cart → checkout → orders
- [ ] Admin: login → products CRUD → orders management
- [ ] Chatbot: consulta de producto, rastreo de orden
- [ ] Emails: verificar recepción de todos los templates
- [ ] Mobile QA en dispositivos reales

### Día 23: Fixes y deploy a producción
- [ ] Corregir bugs encontrados en QA
- [ ] Deploy API a Railway (production)
- [ ] Deploy Web a Vercel (production)
- [ ] Verificar SSL, redirects, y headers de seguridad
- [ ] Stripe: activar modo live (si aplica) o mantener test mode

### Día 24: Documentación final
- [ ] Actualizar `README.md` con instrucciones de deploy
- [ ] Documentar variables de entorno de producción
- [ ] Actualizar `apps/web/README.md` con features implementados
- [ ] Crear `CHANGELOG.md` con historial de features
- [ ] Screenshots/GIFs del proyecto para portfolio

### Día 25 (buffer): Refinamiento
- [ ] Performance: analizar Core Web Vitals y optimizar
- [ ] Caché: configurar ISR/revalidación óptima en Next.js
- [ ] Monitoreo: configurar error tracking (Sentry o similar)
- [ ] Analytics: Google Analytics o Vercel Analytics
- [ ] Revisión final del código y cleanup

---

## Notas

- **Días = días laborales de ~4-6 horas de trabajo enfocado**
- **Prioridad**: Si hay limitaciones de tiempo, las semanas 1-2 + deploy (día 20-23) son el MVP funcional
- **AI Chatbot** (días 13-14) puede posponerse si el tiempo es limitado
- **Upstash Redis** (día 19) es opcional si el rate-limit básico de Fastify es suficiente
- El plan asume que las API keys de Stripe, Resend, Cloudinary, Google OAuth y Anthropic están configuradas
