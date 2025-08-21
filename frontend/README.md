# Smart Offertgenerator Frontend

## 🚀 **How to run:**

### **Installation:**
```bash
cd frontend
npm install
```

### **Development:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### **Code Quality:**
```bash
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint linting
npm run lint:fix     # Auto-fix linting issues
npm run format       # Prettier formatting
npm run format:check # Check Prettier formatting
npm run ci           # Full CI pipeline (typecheck + lint + build)
```

### **Testing:**
```bash
npm run test:e2e     # Run Cypress E2E tests headless
npm run test:e2e:open # Open Cypress test runner
npm run cypress:open # Open Cypress
npm run cypress:run  # Run Cypress tests
```

## 🛠️ **Tech Stack:**

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.4
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI + Custom components
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Testing**: Cypress E2E

## 📋 **Code Quality Standards:**

### **TypeScript:**
- Strict mode enabled
- No implicit `any` types
- Strict null checks
- Unused variable detection

### **ESLint:**
- Next.js recommended rules
- TypeScript specific rules
- Accessibility (jsx-a11y) rules
- Code quality rules

### **Prettier:**
- Single quotes
- 80 character line width
- 2 space indentation
- Trailing commas

### **Accessibility:**
- WCAG AA compliance
- ARIA attributes
- Keyboard navigation
- Screen reader support

## 🔧 **Configuration Files:**

- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintignore` - ESLint ignore patterns
- `.prettierignore` - Prettier ignore patterns

## 📁 **Project Structure:**

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   └── system/         # System components (Loading, Error, etc.)
├── copy/                # Internationalization (Swedish)
├── lib/                 # Utility functions
└── types/               # TypeScript type definitions
```

## 🚨 **Common Issues:**

### **TypeScript Errors:**
- Run `npm run typecheck` to see all type issues
- Fix implicit `any` types
- Add proper type annotations

### **Linting Errors:**
- Run `npm run lint` to see all linting issues
- Run `npm run lint:fix` to auto-fix issues
- Check accessibility rules with jsx-a11y

### **Build Issues:**
- Ensure all TypeScript errors are fixed
- Check for unused imports/variables
- Verify component prop types

## 📚 **Best Practices:**

1. **Type Safety**: Always use proper TypeScript types
2. **Accessibility**: Follow WCAG guidelines and use ARIA attributes
3. **Performance**: Use React.memo, useCallback, useMemo where appropriate
4. **Code Style**: Follow ESLint and Prettier rules
5. **Testing**: Write E2E tests for critical user flows
6. **Internationalization**: Use the copy system for all user-facing text

## 🔍 **Debugging:**

- Check browser console for runtime errors
- Use `npm run typecheck` for TypeScript issues
- Use `npm run lint` for code quality issues
- Check Cypress tests for E2E issues

## 📝 **Contributing:**

1. Follow the established code quality standards
2. Run `npm run ci` before committing
3. Ensure all tests pass
4. Update documentation as needed
