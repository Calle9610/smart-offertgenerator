# 🎨 Design System - Smart Offertgenerator

Detta dokument beskriver designsystemet för Smart Offertgenerator frontend.

## 🚀 Snabbstart

### **Installera Dependencies**

```bash
cd frontend
npm install
```

### **Kör Styleguide**

```bash
npm run dev
# Öppna http://localhost:3000/styleguide
```

## 🎯 Designprinciper

### **Tillgänglighet (WCAG AA)**
- **Kontrast** - Alla färger uppfyller kontrastkrav
- **Fokus** - Tydliga focus rings på alla interaktiva element
- **Semantik** - Korrekt HTML-struktur och ARIA-attribut
- **Tangentbord** - Fullständig tangentbordsnavigering

### **Responsiv Design (Mobile-first)**
- **Breakpoints** - sm (640px), md (768px), lg (1024px), xl (1280px)
- **Flexibel layout** - Grid och Flexbox för anpassningsbar design
- **Touch-friendly** - Minsta 44px för touch-targets

### **Performance (Core Web Vitals)**
- **Lazy loading** - Komponenter laddas vid behov
- **Optimized animations** - CSS transitions istället för JavaScript
- **Efficient CSS** - Tailwind för minimal bundle size

### **Konsekvent Design**
- **Design tokens** - Centraliserade värden för färger, spacing, typografi
- **Komponentbibliotek** - Återanvändbara UI-komponenter
- **Design system** - Enhetlig visuell identitet

## 🎨 Design Tokens

### **Färger**

#### **Brand Colors (Blå ton)**
```css
--brand-50: 213 100% 96%   /* Ljusaste blå */
--brand-500: 217 91% 60%   /* Huvudfärg */
--brand-900: 224 64% 33%   /* Mörkaste blå */
```

#### **Neutral Colors (Grå ton)**
```css
--neutral-50: 0 0% 98%     /* Ljusaste grå */
--neutral-500: 0 0% 45%    /* Mellangrå */
--neutral-900: 0 0% 9%     /* Mörkaste grå */
```

#### **Semantic Colors**
```css
--success-500: 142 76% 36% /* Grön för framgång */
--warn-500: 38 92% 50%     /* Orange för varning */
--error-500: 0 84% 60%     /* Röd för fel */
```

### **Typografi**

#### **Display Sizes**
```css
.text-display-1 /* 3.5rem - 56px */
.text-display-2 /* 3rem - 48px */
.text-display-3 /* 2.5rem - 40px */
```

#### **Heading Sizes**
```css
.text-h1 /* 2.25rem - 36px */
.text-h2 /* 1.875rem - 30px */
.text-h3 /* 1.5rem - 24px */
.text-h4 /* 1.25rem - 20px */
.text-h5 /* 1.125rem - 18px */
.text-h6 /* 1rem - 16px */
```

#### **Body Sizes**
```css
.text-body-lg /* 1.125rem - 18px */
.text-body /* 1rem - 16px */
.text-body-sm /* 0.875rem - 14px */
.text-small /* 0.75rem - 12px */
.text-xs /* 0.625rem - 10px */
```

### **Spacing**

#### **Standard Scale**
```css
.p-1  /* 0.25rem - 4px */
.p-2  /* 0.5rem - 8px */
.p-4  /* 1rem - 16px */
.p-6  /* 1.5rem - 24px */
.p-8  /* 2rem - 32px */
.p-12 /* 3rem - 48px */
.p-16 /* 4rem - 64px */
```

#### **Custom Spacing**
```css
.p-18 /* 4.5rem - 72px */
.p-88 /* 22rem - 352px */
.p-128 /* 32rem - 512px */
.p-144 /* 36rem - 576px */
```

### **Border Radius**

```css
.rounded-xs  /* 0.125rem - 2px */
.rounded-sm  /* 0.25rem - 4px */
.rounded-md  /* 0.375rem - 6px */
.rounded-lg  /* 0.5rem - 8px */
.rounded-xl  /* 0.75rem - 12px */
.rounded-2xl /* 1rem - 16px */
.rounded-3xl /* 1.5rem - 24px */
.rounded-full /* 9999px */
```

### **Shadows**

#### **Standard Shadows**
```css
.shadow-xs   /* Subtile skugga */
.shadow-sm   /* Lätt skugga */
.shadow-md   /* Medium skugga */
.shadow-lg   /* Stor skugga */
.shadow-xl   /* Extra stor skugga */
.shadow-2xl  /* Massive skugga */
```

#### **Colored Shadows**
```css
.shadow-brand  /* Blå skugga */
.shadow-success /* Grön skugga */
.shadow-warn   /* Orange skugga */
.shadow-error  /* Röd skugga */
```

## 🧩 UI-komponenter

### **Button**
```tsx
import { Button } from '@/components/ui/Button'

// Olika varianter
<Button variant="default">Default</Button>
<Button variant="brand">Brand</Button>
<Button variant="success">Success</Button>

// Olika storlekar
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// Med ikoner
<Button leftIcon={<Mail />}>Med ikon</Button>
<Button loading>Loading</Button>
```

### **Card**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

<Card>
  <CardHeader>
    <CardTitle>Kort titel</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Innehåll i kortet</p>
  </CardContent>
</Card>
```

### **Input**
```tsx
import { Input } from '@/components/ui/Input'

<Input 
  label="E-post"
  placeholder="ange@email.com"
  leftIcon={<Mail />}
  helperText="Vi delar aldrig din e-post"
/>
```

### **Select**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Välj kategori" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="design">Design</SelectItem>
    <SelectItem value="development">Utveckling</SelectItem>
  </SelectContent>
</Select>
```

### **Badge**
```tsx
import { Badge } from '@/components/ui/Badge'

<Badge variant="success">Aktiv</Badge>
<Badge variant="warn">Varning</Badge>
<Badge variant="error">Fel</Badge>
```

### **Tabs**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Översikt</TabsTrigger>
    <TabsTrigger value="details">Detaljer</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Översiktsinnehåll</TabsContent>
  <TabsContent value="details">Detaljinnehåll</TabsContent>
</Tabs>
```

### **Table**
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Namn</TableHead>
      <TableHead>E-post</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Anna Andersson</TableCell>
      <TableCell>anna@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### **Modal**
```tsx
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/Modal'

<Modal>
  <ModalTrigger asChild>
    <Button>Öppna modal</Button>
  </ModalTrigger>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Modal titel</ModalTitle>
    </ModalHeader>
    <p>Modal innehåll</p>
  </ModalContent>
</Modal>
```

### **Toast**
```tsx
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/Toast'

<ToastProvider>
  <Toast>
    <ToastTitle>Meddelande</ToastTitle>
    <ToastDescription>Beskrivning av meddelandet</ToastDescription>
  </Toast>
  <ToastViewport />
</ToastProvider>
```

## 🌙 Dark Mode

### **Automatisk Detektering**
- **System preference** - Följer datorns inställningar
- **Manual toggle** - Användare kan välja tema
- **Persistent** - Val sparas i localStorage

### **CSS Variabler**
```css
:root {
  /* Light theme colors */
  --background: 0 0% 100%;
  --foreground: 222 84% 5%;
}

.dark {
  /* Dark theme colors */
  --background: 222 84% 5%;
  --foreground: 210 40% 98%;
}
```

### **Theme Toggle**
```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle'

<ThemeToggle />
```

## 📱 Responsiv Design

### **Breakpoints**
```css
/* Mobile first approach */
.container {
  padding: 1rem; /* Default för mobile */
}

@media (min-width: 768px) {
  .container {
    padding: 2rem; /* md breakpoint */
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 3rem; /* lg breakpoint */
  }
}
```

### **Grid System**
```tsx
// Responsiv grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 kolumn på mobile, 2 på md, 3 på lg */}
</div>
```

### **Flexbox Utilities**
```tsx
// Responsiv flexbox
<div className="flex flex-col md:flex-row gap-4">
  {/* Kolumn på mobile, rad på md+ */}
</div>
```

## 🎭 Animationer

### **CSS Transitions**
```css
/* Standard transitions */
.transition-colors { transition: color 0.2s, background-color 0.2s; }
.transition-opacity { transition: opacity 0.2s; }
.transition-transform { transition: transform 0.2s; }
```

### **Custom Animations**
```css
/* Fade in/out */
.animate-fade-in { animation: fadeIn 0.2s ease-in-out; }
.animate-fade-out { animation: fadeOut 0.2s ease-in-out; }

/* Slide animations */
.animate-slide-in { animation: slideIn 0.2s ease-out; }
.animate-slide-out { animation: slideOut 0.2s ease-in; }
```

### **Framer Motion (Framtida)**
```tsx
// Kommer att implementeras för komplexa animationer
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Animerat innehåll
</motion.div>
```

## ♿ Tillgänglighet

### **ARIA-attribut**
```tsx
// Korrekt labeling
<Input 
  id="email"
  aria-describedby="email-help"
  aria-invalid={hasError}
/>

// Screen reader support
<span className="sr-only">Beskrivning för skärmläsare</span>
```

### **Focus Management**
```css
/* Focus ring styles */
*:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: var(--focus-ring);
  ring-offset: 2px;
}
```

### **Keyboard Navigation**
```tsx
// Tabindex och keyboard events
<Button 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Klicka eller tryck Enter
</Button>
```

## 🧪 Testning

### **Komponenttester**
```bash
# Kör alla tester
npm run test

# Kör specifika komponenter
npm run test Button
npm run test Card
```

### **Visual Regression Testing**
```bash
# Snapshot testing
npm run test:visual

# Storybook (framtida)
npm run storybook
```

## 📚 Dokumentation

### **Styleguide**
- **URL**: `/styleguide`
- **Innehåll**: Alla komponenter med exempel
- **Interaktiv**: Testa komponenter i realtid
- **Responsiv**: Se hur komponenter ser ut på olika skärmar

### **Komponent API**
- **Props**: Alla tillgängliga props
- **Variants**: Olika varianter av komponenter
- **Examples**: Praktiska användningsexempel
- **Accessibility**: Tillgänglighetsinformation

## 🚀 Framtida Utveckling

### **Planerade Komponenter**
- **DataTable** - Avancerad tabell med sortering/filtrering
- **DatePicker** - Datumväljare
- **FileUpload** - Filuppladdning
- **RichTextEditor** - Textredigerare
- **Charts** - Diagram och grafer

### **Förbättringar**
- **Storybook** - Komponentdokumentation
- **Design tokens** - Mer avancerade tokens
- **Animation library** - Framer Motion integration
- **Icon system** - Centraliserat ikonbibliotek

---

**🎉 Designsystemet är redo att användas!**

För frågor eller förslag, kontakta utvecklingsteamet.
