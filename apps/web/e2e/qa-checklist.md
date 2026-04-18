# QA Final — Día 22 Checklist

Checklist de verificación manual para los elementos que no pueden automatizarse completamente con Playwright.

---

## 1. Emails transaccionales

Para cada email, verificar: envío correcto, renderizado en cliente (Gmail/Outlook), links funcionales, y que no va a spam.

### Welcome Email (registro de nuevo usuario)
- [ ] Registrar una nueva cuenta en `/auth/register`
- [ ] Verificar recepción del email de bienvenida en la bandeja de entrada
- [ ] Verificar que el asunto, nombre del usuario y logo se muestran correctamente
- [ ] Verificar que el link de verificación de email funciona (si aplica)
- [ ] Email no cae en spam

### Password Reset Email
- [ ] Solicitar reset de contraseña en `/auth/forgot-password`
- [ ] Verificar recepción del email de reset en < 2 minutos
- [ ] Verificar que el link de reset funciona y lleva a `/auth/reset-password`
- [ ] Verificar que el token expira correctamente (no funciona después de usarse)
- [ ] Email no cae en spam

### Order Confirmation Email (checkout.session.completed webhook)
- [ ] Completar un checkout con Stripe (tarjeta de prueba 4242 4242 4242 4242)
- [ ] Verificar recepción del email de confirmación de orden
- [ ] Verificar que muestra: número de orden, items, subtotal, shipping, total
- [ ] Verificar que el link de tracking funciona (redirige a `/orders?order=...&email=...`)
- [ ] Email no cae en spam

### Order Shipped Email (cambio de estado a SHIPPED)
- [ ] En el panel admin, cambiar el estado de una orden a SHIPPED
- [ ] Verificar recepción del email de notificación de envío
- [ ] Verificar que muestra número de orden y mensaje de envío
- [ ] Email no cae en spam

---

## 2. Mobile QA — Dispositivos reales

Verificar en dispositivos físicos o con Chrome DevTools (emulación responsive):

### Tamaños a probar
- [ ] Mobile S (320px) — iPhone SE
- [ ] Mobile M (375px) — iPhone 12
- [ ] Mobile L (428px) — iPhone 14 Pro Max
- [ ] Tablet (768px) — iPad
- [ ] Desktop (1280px+)

### Páginas a verificar en mobile

#### Home `/`
- [ ] Hero section visible y legible
- [ ] Navbar mobile (hamburger menu funciona)
- [ ] Productos destacados en grid responsive
- [ ] Footer visible y legible

#### Products `/products`
- [ ] Grid de productos se adapta (1 col en mobile, 2 en tablet, 3+ en desktop)
- [ ] Filtros/búsqueda accesibles
- [ ] ProductCard muestra imagen, nombre y precio correctamente

#### Product Detail `/products/[slug]`
- [ ] Imagen del producto se muestra en tamaño correcto
- [ ] Botón "Add to Cart" tiene min 44×44px (touch target)
- [ ] Descripción y detalles legibles
- [ ] Reseñas renderizadas correctamente

#### Cart `/cart`
- [ ] Items del carrito se ven correctamente
- [ ] Controles de cantidad accesibles (botones suficientemente grandes)
- [ ] Total visible
- [ ] Botón de checkout accesible

#### Checkout `/checkout`
- [ ] Formulario de dirección se puede completar en mobile
- [ ] Labels visibles encima de inputs
- [ ] Botón "Place Order" accesible y visible
- [ ] Keyboard no tapa el formulario

#### Order Tracking `/orders`
- [ ] Formulario de tracking visible
- [ ] Resultados de tracking legibles (timeline, items)
- [ ] Imágenes de items se muestran

#### Auth pages `/auth/login`, `/auth/register`
- [ ] Formularios completables en mobile
- [ ] Google OAuth button visible

#### Account `/account`
- [ ] Información del perfil visible
- [ ] Orden history legible

#### Admin `/admin` (tablet/desktop mainly)
- [ ] Dashboard KPIs visibles en tablet
- [ ] Tablas de productos/órdenes con scroll horizontal si es necesario

### Chat Widget
- [ ] FAB visible y accessible en mobile (no tapado por otros elementos)
- [ ] Panel del chatbot ocupa full screen en mobile (backdrop visible)
- [ ] Input del chat accesible cuando el teclado virtual aparece
- [ ] Cerrar chatbot funciona con backdrop tap y botón X

---

## 3. Notas de QA

- **Stripe test card**: `4242 4242 4242 4242` | Exp: cualquier fecha futura | CVC: cualquier 3 dígitos
- **Admin credentials**: `admin@slicing-edge.com` / `admin123`
- **API base URL dev**: `http://localhost:3001`
- **Web base URL dev**: `http://localhost:3000`
- Si los emails no llegan, verificar que `RESEND_API_KEY` está configurado en `apps/api/.env`
- Stripe webhooks en dev requieren `stripe listen --forward-to localhost:3001/api/checkout/webhook`

---

## 4. Estado

| Tarea | Estado |
|-------|--------|
| Welcome email | ⬜ Pendiente |
| Password reset email | ⬜ Pendiente |
| Order confirmation email | ⬜ Pendiente |
| Order shipped email | ⬜ Pendiente |
| Mobile QA — Home | ⬜ Pendiente |
| Mobile QA — Products | ⬜ Pendiente |
| Mobile QA — Product Detail | ⬜ Pendiente |
| Mobile QA — Cart | ⬜ Pendiente |
| Mobile QA — Checkout | ⬜ Pendiente |
| Mobile QA — Order Tracking | ⬜ Pendiente |
| Mobile QA — Auth pages | ⬜ Pendiente |
| Mobile QA — Account | ⬜ Pendiente |
| Mobile QA — Chat Widget | ⬜ Pendiente |
