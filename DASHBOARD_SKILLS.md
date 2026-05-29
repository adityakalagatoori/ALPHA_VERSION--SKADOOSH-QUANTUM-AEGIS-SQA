# SQA Dashboard — Design Skills

Before making ANY change to the dashboard (frontend UI, components, pages, styles),
read this file first and apply every applicable skill listed below.

---

## Installed Skills

### 1. Framer Motion — Animations
- **Package:** `framer-motion@12.40.0`
- **Import:** `import { motion, AnimatePresence } from "framer-motion"`
- **Rules:**
  - Use `motion.*` variants for all new or updated UI elements (cards, buttons, panels, lists)
  - Page transitions: wrap page content in `<motion.div>` with `initial`, `animate`, `exit` props
  - Cards: `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`
  - Buttons: `whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.97 }}`
  - Lists: stagger children using `variants` with `staggerChildren`
  - Use `AnimatePresence` when elements conditionally appear/disappear
  - Durations: `0.2s–0.4s` for micro-interactions, `0.4s–0.6s` for page/panel transitions

---

### 2. Scroll-Driven 3D Card — ContainerScroll
- **File:** `frontend/src/components/ui/container-scroll-animation.tsx`
- **Export:** `ContainerScroll`, `Header`, `Card`
- **Use for:** Hero sections or feature showcases with scroll-based 3D perspective flip effect
- **Example:** `<ContainerScroll titleComponent={<Header>Title</Header>}><Card>...</Card></ContainerScroll>`

---

### 3. Animated Hero — Cycling Titles
- **File:** `frontend/src/components/ui/animated-hero.tsx`
- **Export:** `AnimatedHero`
- **Use for:** Landing page hero with cycling subtitle animations (spring transitions)

---

### 4. Aurora Background
- **File:** `frontend/src/components/ui/aurora-background.tsx`
- **Export:** `AuroraBackground`
- **Requires:** `animate-aurora` keyframe in tailwind.config.js (already added), CSS vars in index.css
- **Use for:** Full-page animated gradient aurora effect as background wrapper

---

### 5. Particle Sparkles
- **File:** `frontend/src/components/ui/sparkles.tsx`
- **Export:** `SparklesCore`
- **Package:** `@tsparticles/react`, `@tsparticles/slim`, `@tsparticles/engine`
- **Use for:** Particle field backgrounds, hero sections, section dividers

---

### 6. Background Animated Paths
- **File:** `frontend/src/components/ui/background-paths.tsx`
- **Export:** `BackgroundPaths`
- **Use for:** SVG animated path overlays with letter-by-letter text animation

---

### 7. Lamp Effect
- **File:** `frontend/src/components/ui/lamp.tsx`
- **Export:** `LampContainer`, `LampDemo`
- **Use for:** Conic gradient spotlight/lamp effect for section headers or hero areas

---

### 8. WebGL Shader Background
- **File:** `frontend/src/components/ui/shader-background.tsx`
- **Export:** `ShaderBackground`
- **Use for:** Animated plasma/grid WebGL1 shader as full-screen background, no external deps

---

### 9. Three.js Shader Animation
- **File:** `frontend/src/components/ui/shader-animation.tsx`
- **Export:** `ShaderAnimation`
- **Package:** `three`, `@types/three`, `@react-three/fiber`
- **Use for:** 3D animated shader mesh using Three.js ShaderMaterial

---

### 10. Radial Orbital Timeline
- **File:** `frontend/src/components/ui/radial-orbital-timeline.tsx`
- **Export:** `RadialOrbitalTimeline`
- **Use for:** Interactive orbital timeline visualization — nodes orbit a center, click to expand. Great for feature showcases or security pipeline visualization

---

### 11. Liquid Glass Effect
- **File:** `frontend/src/components/ui/liquid-glass.tsx`
- **Exports:** `GlassDock`, `GlassButton`
- **Use for:** SVG feDisplacementMap glass distortion, macOS-style dock with glass buttons

---

### 12. Sparkles Text
- **File:** `frontend/src/components/ui/sparkles-text.tsx`
- **Export:** `SparklesText`
- **Use for:** Animated sparkle SVG stars orbiting text, great for titles and highlights

---

### 13. Ripple Buttons (4 variants)
- **File:** `frontend/src/components/ui/multi-type-ripple-buttons.tsx`
- **Export:** `RippleButton`
- **Variants:** `default`, `hover`, `ghost`, `hoverborder`
- **Use for:** Interactive buttons with click/hover ripple effects. Use `hoverborder` for ghost-style pill buttons with glow border on hover

---

### 14. Background Gradient Animation
- **File:** `frontend/src/components/ui/background-gradient-animation.tsx`
- **Export:** `BackgroundGradientAnimation`
- **Requires:** `first`–`fifth` animations in tailwind.config.js (already added)
- **Use for:** Interactive animated gradient blobs that follow mouse cursor, full-page backgrounds

---

### 15. Smoke Background
- **File:** `frontend/src/components/ui/spooky-smoke-animation.tsx`
- **Export:** `SmokeBackground`
- **Props:** `smokeColor?: string` (hex, default `"#808080"`)
- **Use for:** WebGL2 smoke shader, customizable color. Great for dark, atmospheric section backgrounds

---

### 16. Creative Pricing Cards
- **File:** `frontend/src/components/ui/creative-pricing.tsx`
- **Exports:** `CreativePricing`, `PricingTier`
- **Use for:** Rotated hand-drawn style pricing cards with hover shadow lift effect

---

### 17. Orbiting Skills Visualization
- **File:** `frontend/src/components/ui/orbiting-skills.tsx`
- **Export:** `OrbitingSkills` (default)
- **Use for:** Animated orbital tech skill icons on glowing orbit paths. Pauses on hover. Great for About/Skills sections

---

### 18. Incident Report Chart
- **File:** `frontend/src/components/ui/area-chart-1.tsx`
- **Export:** `IncidentReportCard` (default)
- **Package:** `reaviz`, `framer-motion`
- **Use for:** Multi-series area chart with metric cards showing security/incident KPIs

---

### 19. Accordion
- **File:** `frontend/src/components/ui/accordion.tsx`
- **Exports:** `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- **Package:** `@radix-ui/react-accordion`
- **Use for:** Collapsible FAQ sections, nested navigation menus

---

### 20. Navigation Menu
- **File:** `frontend/src/components/ui/navigation-menu.tsx`
- **Exports:** `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuViewport`
- **Package:** `@radix-ui/react-navigation-menu`
- **Use for:** Desktop mega-menu navigation with animated dropdown panels

---

### 21. Sheet (Drawer)
- **File:** `frontend/src/components/ui/sheet.tsx`
- **Exports:** `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetFooter`, `SheetDescription`, `SheetClose`
- **Package:** `@radix-ui/react-dialog`
- **Use for:** Slide-in side drawers for mobile menus, settings panels, detail views

---

### 22. Input
- **File:** `frontend/src/components/ui/input.tsx`
- **Export:** `Input`
- **Use for:** Styled text inputs with shadcn design tokens

---

### 23. Label
- **File:** `frontend/src/components/ui/label.tsx`
- **Export:** `Label`
- **Package:** `@radix-ui/react-label`
- **Use for:** Accessible form labels paired with Input components

---

### 24. Navbar (Full-Featured)
- **File:** `frontend/src/components/blocks/shadcnblocks-com-navbar1.tsx`
- **Export:** `Navbar1`
- **Props:** `logo`, `menu` (supports nested dropdowns), `mobileExtraLinks`, `auth`
- **Use for:** Desktop nav with NavigationMenu dropdowns + mobile Sheet drawer. Fully responsive

---

### 25. shadcn Primitives (Always Available)
All standard shadcn/ui primitives are installed in `frontend/src/components/ui/`:
- **Button** — `button.tsx` — variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Badge** — `badge.tsx` — variants: `default`, `secondary`, `destructive`, `outline`
- **Card** — `card.tsx` — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Avatar** — `avatar.tsx` — `Avatar`, `AvatarImage`, `AvatarFallback`
- **Separator** — `separator.tsx` — horizontal/vertical divider line

---

## Tailwind Animations Available
Defined in `tailwind.config.js` — use directly as Tailwind classes:
- `animate-aurora` — slow gradient aurora sweep
- `animate-first` through `animate-fifth` — gradient blob movements for BackgroundGradientAnimation
- `animate-spin-slow` — 8s slow spin
- `animate-spin-reverse` — 8s reverse spin
- `animate-accordion-down` / `animate-accordion-up` — accordion open/close
- `animate-fade-in`, `animate-slide-up` — simple entrance animations
- `animate-pulse` (built-in Tailwind) — pulsing glow effects

---

## How to Apply

For each dashboard change:
1. Read this file
2. Check which skills/components apply to the change being made
3. Apply all applicable skills in the implementation
4. For new pages: use `motion.div` wrappers, pick a background component, use shadcn primitives for layout
5. Never skip a skill that applies to the task
