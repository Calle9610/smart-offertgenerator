# 🤝 Contributing to Smart Offertgenerator

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- Git

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd smart-offertgenerator

# Start development environment
./start.sh
```

## 📝 **Commit Style Guide**

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```bash
feat(quotes): add dynamic add-ons with real-time total updates
fix(auth): resolve JWT token validation issue
docs(api): update endpoint documentation
style(frontend): apply consistent formatting
refactor(backend): simplify quote calculation logic
test(quotes): add comprehensive quote flow tests
chore(deps): update dependencies
```

### Scope
- **frontend**: Frontend-related changes
- **backend**: Backend-related changes
- **api**: API endpoint changes
- **auth**: Authentication changes
- **db**: Database changes
- **docs**: Documentation changes

## 🔄 **Pull Request Guidelines**

### **CRITICAL REQUIREMENTS**
- ✅ **Tests MUST pass** before merge
- ✅ **TypeScript compilation** must succeed
- ✅ **One file at a time** - small, focused changes
- ✅ **No breaking changes** without discussion

### PR Size
- **Small PRs preferred**: < 200 lines changed
- **Medium PRs**: 200-500 lines (requires review)
- **Large PRs**: > 500 lines (avoid unless necessary)

### PR Template
```markdown
## 📋 Description
Brief description of changes

## 🔍 What Changed
- [ ] Feature A
- [ ] Bug fix B
- [ ] Documentation update C

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## 📸 Screenshots (if applicable)
Add screenshots for UI changes

## ✅ Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements left
- [ ] Error handling implemented
```

## 🧪 **Testing Requirements**

### Frontend Tests
```bash
# Run all frontend tests
cd frontend
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Type checking
npm run typecheck
```

### Backend Tests
```bash
# Run all backend tests
cd backend
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_quotes.py
```

### E2E Tests
```bash
# Playwright tests
npx playwright test

# Cypress tests
npx cypress run
```

## 🏗️ **Development Workflow**

### 1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

### 2. **Make Changes**
- **One file at a time**
- **Small, incremental commits**
- **Test frequently**

### 3. **Commit Your Changes**
```bash
git add .
git commit -m "feat(scope): description"
```

### 4. **Push and Create PR**
```bash
git push origin feature/your-feature-name
# Create PR on GitHub/GitLab
```

### 5. **Code Review**
- Address all review comments
- Update tests if needed
- Ensure CI passes

### 6. **Merge**
- Squash commits if requested
- Delete feature branch after merge

## 🎨 **Code Style**

### Frontend (TypeScript/React)
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind CSS for styling
- Follow ESLint rules
- Use meaningful variable names

### Backend (Python/FastAPI)
- Follow PEP 8 style guide
- Use type hints
- Write docstrings for all functions
- Use async/await for I/O operations
- Handle errors gracefully

### Database
- All queries must be multi-tenant scoped
- Use Alembic for migrations
- Write migrations for every schema change
- Document complex queries

## 🚫 **What NOT to Do**

- ❌ Don't commit directly to main branch
- ❌ Don't skip tests
- ❌ Don't ignore TypeScript errors
- ❌ Don't make large, unfocused changes
- ❌ Don't commit sensitive data
- ❌ Don't ignore code review feedback

## 🆘 **Getting Help**

- **Documentation**: Check `docs/` directory
- **Issues**: Create GitHub issue with clear description
- **Discussions**: Use GitHub Discussions for questions
- **Tech Lead**: @carllundin

## 📚 **Resources**

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Remember**: Quality over quantity. Small, well-tested changes are better than large, untested ones! 🎯
