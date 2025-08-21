# Smart Offertgenerator Backend

## 🚀 **How to run:**

### **Installation:**
```bash
cd backend
pip install -e ".[dev,test]"
```

### **Development:**
```bash
make dev              # Start development server
make install          # Install production dependencies
make install-dev      # Install development dependencies
```

### **Code Quality:**
```bash
make lint             # Run Ruff linter
make format           # Format code with Ruff
make check            # Run linting and formatting checks
make typecheck        # Run MyPy type checking
make ci               # Full CI pipeline (check + typecheck + test)
```

### **Testing:**
```bash
make test             # Run tests
make test-cov         # Run tests with coverage
```

### **Utilities:**
```bash
make clean            # Clean cache and build files
make help             # Show all available commands
```

## 🛠️ **Tech Stack:**

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL + SQLAlchemy 2.0
- **Migrations**: Alembic
- **Validation**: Pydantic 2.0
- **Authentication**: JWT + Passlib
- **Testing**: pytest + pytest-asyncio
- **Code Quality**: Ruff + MyPy

## 📋 **Code Quality Standards:**

### **Ruff (Linting + Formatting):**
- **Style**: PEP 8 compliance
- **Imports**: Automatic sorting and organization
- **Complexity**: McCabe complexity checks
- **Security**: Security-focused linting rules
- **Performance**: Performance optimization suggestions

### **MyPy (Type Checking):**
- **Strict mode**: No implicit `any` types
- **Pydantic integration**: Full Pydantic 2.0 support
- **SQLAlchemy integration**: Type-safe database operations
- **Plugin system**: Extended type checking capabilities

### **Code Style:**
- **Line length**: 88 characters (Black-compatible)
- **Quotes**: Double quotes for strings
- **Indentation**: 4 spaces
- **Import sorting**: Automatic with Ruff

## 🔧 **Configuration Files:**

- `pyproject.toml` - Project configuration and dependencies
- `.ruff.toml` - Ruff linting and formatting rules
- `.mypy.ini` - MyPy type checking configuration
- `Makefile` - Development commands and shortcuts

## 📁 **Project Structure:**

```
backend/
├── app/                 # Main application code
│   ├── __init__.py
│   ├── main.py         # FastAPI application
│   ├── auth.py         # Authentication logic
│   ├── crud.py         # Database operations
│   ├── db.py           # Database configuration
│   ├── models.py       # SQLAlchemy models
│   ├── schemas.py      # Pydantic schemas
│   └── ...
├── alembic/            # Database migrations
├── tests/              # Test suite
├── pyproject.toml      # Project configuration
├── .ruff.toml         # Ruff configuration
├── .mypy.ini          # MyPy configuration
├── Makefile           # Development commands
└── README.md          # This file
```

## 🚨 **Common Issues & Solutions:**

### **Ruff Errors:**
```bash
# Fix linting issues
make lint

# Common fixes:
# - Fix import sorting issues
# - Remove unused imports/variables
# - Fix line length issues
# - Add missing type annotations
```

### **MyPy Errors:**
```bash
# Check type issues
make typecheck

# Common fixes:
# - Add proper type annotations
# - Handle None cases properly
# - Fix import type issues
# - Use proper generic types
```

### **Import Issues:**
```bash
# Fix import sorting
make format

# Common fixes:
# - Group imports properly (stdlib, third-party, local)
# - Remove unused imports
# - Fix circular imports
```

## 📚 **Best Practices:**

### **Type Annotations:**
```python
# ✅ Good: Proper type annotations
from typing import List, Optional
from pydantic import BaseModel

def get_quotes_by_company(
    db: Session, 
    company_id: UUID
) -> List[Quote]:
    """Get all quotes for a company."""
    return db.query(Quote).filter(Quote.company_id == company_id).all()

# ❌ Bad: No type annotations
def get_quotes_by_company(db, company_id):
    return db.query(Quote).filter(Quote.company_id == company_id).all()
```

### **Pydantic Models:**
```python
# ✅ Good: Proper Pydantic model
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class QuoteCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=100)
    project_name: str = Field(..., min_length=1, max_length=200)
    total_amount: Optional[Decimal] = Field(None, ge=0)
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }
```

### **SQLAlchemy Models:**
```python
# ✅ Good: Proper SQLAlchemy model
from sqlalchemy import Column, String, Numeric, DateTime, UUID
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.sql import func
from app.db import Base

class Quote(Base):
    __tablename__ = "quote"
    
    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True), 
        primary_key=True, 
        default=uuid4
    )
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
```

## 🔍 **Code Review Checklist:**

### **Before Submitting:**
- [ ] All Ruff linting issues resolved
- [ ] Code formatted with Ruff
- [ ] All MyPy type errors fixed
- [ ] Tests pass
- [ ] No new warnings introduced
- [ ] Documentation updated

### **Review Focus:**
- **Type Safety**: Proper type annotations
- **Code Quality**: Clean, maintainable code
- **Performance**: No obvious performance issues
- **Security**: Proper input validation
- **Testing**: Adequate test coverage

## 📝 **Commit Guidelines:**

### **Commit Message Format:**
```
type(scope): description

feat(quotes): add quote creation endpoint
fix(auth): resolve JWT validation issue
docs(api): update endpoint documentation
```

### **Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code formatting
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## 🆘 **Getting Help:**

### **Resources:**
- **FastAPI**: [Documentation](https://fastapi.tiangolo.com/)
- **SQLAlchemy**: [Documentation](https://docs.sqlalchemy.org/)
- **Pydantic**: [Documentation](https://docs.pydantic.dev/)
- **Ruff**: [Documentation](https://docs.astral.sh/ruff/)
- **MyPy**: [Documentation](https://mypy.readthedocs.io/)

### **Team Support:**
- **Code Reviews**: Submit PRs for review
- **Questions**: Use team chat/meetings
- **Issues**: Create GitHub issues with details

## 🎯 **Quality Gates:**

### **Must Pass:**
- ✅ Ruff linting
- ✅ Ruff formatting
- ✅ MyPy type checking
- ✅ Tests pass
- ✅ No new warnings

### **Should Pass:**
- ✅ Test coverage > 80%
- ✅ Performance benchmarks
- ✅ Security audit
- ✅ Documentation completeness

---

**Remember**: Quality is everyone's responsibility. Every commit should improve the codebase! 🚀
