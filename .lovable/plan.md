

# Ética Áxis Imobiliária — Website

A dark luxury real estate website in Portuguese, inspired by the reference portfolio's animation patterns and the brand's sophisticated identity.

## Design Direction
- **Dark luxury palette**: Deep navy/charcoal backgrounds (#0A0A14), gold accents (#C9A96E matching the logo), white text
- **Typography**: Inter font, tight tracking on headlines, mono for labels — same rhythm as reference
- **Animations**: Scroll reveal, masked text reveal, parallax images, marquee divider, Ken Burns carousel — all reused from reference patterns
- **Glass/blur surfaces** for cards and overlays on dark backgrounds

## Pages

### 1. Home (Landing Page)
- **Hero**: Full-width image carousel with Ken Burns effect (luxury property photos), overlay gradient, masked text reveal title "Imóveis de Alto Padrão", gold badge pills ("Venda" / "Locação"), scroll-down CTA
- **Stats sidebar** (3 stats): Imóveis disponíveis, Anos de experiência, Clientes satisfeitos — with hover-to-white effect from reference
- **Marquee divider**: Scrolling text "Exclusividade • Confiança • Experiência"
- **Featured properties section**: 3 property cards in list-view layout (like the project cards in reference) — image on right, details on left, hover scale + grayscale-to-color effect
- **About teaser**: Split grid (4col / 8col) with brand values on left, brand statement on right with gold accent text
- **CTA footer**: Dark section with large text "Encontre o imóvel dos seus sonhos" + contact button

### 2. Property Listings (`/imoveis`)
- **Filter bar**: Type (Apartamento, Casa, Cobertura), location, price range
- **Grid of property cards**: Image, price, location, bedrooms/bathrooms/area badges
- **Hover effects**: Scale image, reveal details overlay

### 3. Property Detail (`/imoveis/:id`)
- **Image gallery**: Large hero image with thumbnail strip
- **Property specs**: Price, area, bedrooms, bathrooms, parking — in stat-card layout
- **Description section**: Full text with features list (checklist style from reference)
- **Contact form**: Name, email, phone, message — with gold primary button
- **WhatsApp CTA button**

## Shared Components
- **Navigation**: Sticky top bar with logo (Ética Áxis brand image) centered, nav links on sides, gold hover states
- **Footer**: Dark bg, 4-column grid (brand, links, contact info, social), large faded brand name at bottom
- **Property data**: Static mock data with 6-8 luxury properties in Portuguese

## Technical
- React Router for 3 routes (/, /imoveis, /imoveis/:id)
- Tailwind with custom dark luxury color tokens
- Framer Motion or CSS-only for scroll reveal animations
- Brand logo embedded from uploaded image
- Responsive (mobile-first)

