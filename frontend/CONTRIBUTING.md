# Contributing to Smart Offertgenerator Frontend

## 🚀 **Getting Started**

### **Prerequisites:**
- Node.js 18.18.0+ (use `.nvmrc`)
- npm 9.0.0+
- VS Code (recommended)

### **Setup:**
```bash
cd frontend
npm install
npm run prepare  # Install Husky hooks
```

## 📋 **Development Standards**

### **Code Quality:**
- **TypeScript**: Strict mode, no implicit `any`
- **ESLint**: Next.js + TypeScript + Accessibility rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks

### **Accessibility (a11y):**
- **WCAG AA** compliance required
- **ARIA attributes** for interactive elements
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** minimum 4.5:1

### **Internationalization (i18n):**
- **Swedish** as primary language
- **Copy system** (`src/copy/sv.ts`) for all user-facing text
- **No hardcoded strings** in components
- **Consistent tone**: Short, factual, friendly

### **Performance:**
- **Core Web Vitals** optimization
- **Bundle size** monitoring
- **Code splitting** for heavy components
- **Memoization** for expensive operations
- **Image optimization** with `next/image`

## 🔧 **Development Workflow**

### **1. Before Starting:**
```bash
npm run typecheck  # Check TypeScript
npm run lint       # Check ESLint rules
npm run format:check # Check Prettier
```

### **2. During Development:**
- Use VS Code with recommended extensions
- Follow TypeScript strict rules
- Implement accessibility features
- Use Swedish copy from `sv.ts`

### **3. Before Committing:**
```bash
npm run ci  # Full pipeline check
```

### **4. Pre-commit Hooks:**
- TypeScript type checking
- ESLint validation
- Prettier formatting
- Automatic fixes where possible

## 📁 **File Organization**

### **Components:**
```
src/components/
├── ui/           # Base UI components (Button, Input, etc.)
├── system/       # System components (Loading, Error, etc.)
└── [feature]/    # Feature-specific components
```

### **Pages:**
```
src/app/
├── [route]/      # Route-specific pages
├── layout.tsx    # Root layout
└── globals.css   # Global styles
```

### **Utilities:**
```
src/
├── lib/          # Utility functions
├── copy/         # Internationalization
└── types/        # TypeScript definitions
```

## 🧪 **Testing**

### **E2E Testing:**
```bash
npm run test:e2e        # Headless E2E tests
npm run test:e2e:open  # Interactive E2E tests
```

### **Test Coverage:**
- **Critical user flows** must have E2E tests
- **Component behavior** testing
- **Accessibility** testing with pa11y
- **Performance** testing with Lighthouse

## 🚨 **Common Issues & Solutions**

### **TypeScript Errors:**
```bash
# Fix type issues
npm run typecheck

# Common fixes:
# - Add proper type annotations
# - Use proper interfaces/types
# - Handle null/undefined cases
```

### **ESLint Errors:**
```bash
# Auto-fix issues
npm run lint:fix

# Common fixes:
# - Add missing ARIA attributes
# - Fix accessibility violations
# - Remove unused imports/variables
```

### **Build Failures:**
```bash
# Check all issues
npm run ci

# Fix in order:
# 1. TypeScript errors
# 2. ESLint violations
# 3. Build issues
```

## 📚 **Best Practices**

### **Component Design:**
```typescript
// ✅ Good: Proper typing and accessibility
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  'aria-label'?: string;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  'aria-label': ariaLabel,
  ...props 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(buttonVariants({ variant }))}
      {...props}
    >
      {children}
    </button>
  );
}
```

### **Copy Usage:**
```typescript
// ✅ Good: Use copy system
import { useCopy } from '@/copy/useCopy';

export function MyComponent() {
  const copy = useCopy();
  
  return (
    <div>
      <h1>{copy.common.title}</h1>
      <button>{copy.actions.save}</button>
    </div>
  );
}
```

### **Accessibility:**
```typescript
// ✅ Good: Proper ARIA and keyboard support
<div
  role="button"
  tabIndex={0}
  aria-label="Close dialog"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClose();
    }
  }}
  onClick={onClose}
>
  <XIcon aria-hidden="true" />
</div>
```

## 🔍 **Code Review Checklist**

### **Before Submitting:**
- [ ] All TypeScript errors fixed
- [ ] All ESLint violations resolved
- [ ] Code formatted with Prettier
- [ ] Accessibility features implemented
- [ ] Swedish copy used from `sv.ts`
- [ ] E2E tests pass
- [ ] Performance impact assessed
- [ ] Documentation updated

### **Review Focus:**
- **Type Safety**: Proper TypeScript usage
- **Accessibility**: WCAG compliance
- **Performance**: No regressions
- **Code Quality**: Clean, maintainable code
- **Testing**: Adequate test coverage

## 📝 **Commit Guidelines**

### **Commit Message Format:**
```
type(scope): description

feat(quotes): add quote creation wizard
fix(a11y): resolve keyboard navigation issues
docs(readme): update development setup instructions
```

### **Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code formatting
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## 🆘 **Getting Help**

### **Resources:**
- **TypeScript**: [Handbook](https://www.typescriptlang.org/docs/)
- **ESLint**: [Rules](https://eslint.org/docs/rules/)
- **Accessibility**: [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- **Next.js**: [Documentation](https://nextjs.org/docs)

### **Team Support:**
- **Code Reviews**: Submit PRs for review
- **Questions**: Use team chat/meetings
- **Issues**: Create GitHub issues with details

## 🎯 **Quality Gates**

### **Must Pass:**
- ✅ TypeScript compilation
- ✅ ESLint validation
- ✅ Prettier formatting
- ✅ Build success
- ✅ E2E tests pass

### **Should Pass:**
- ✅ Accessibility audit
- ✅ Performance benchmarks
- ✅ Bundle size limits
- ✅ Test coverage thresholds

---

**Remember**: Quality is everyone's responsibility. Every commit should improve the codebase! 🚀
