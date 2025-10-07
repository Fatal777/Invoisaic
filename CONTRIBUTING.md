# Contributing to Invoisaic

Thank you for your interest in contributing to Invoisaic! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Maintain professional communication

## Getting Started

### Prerequisites

- Node.js 18+
- AWS Account with Bedrock access
- Git
- AWS CLI configured
- Basic knowledge of TypeScript, React, and AWS

### Development Setup

1. **Fork and Clone**
```bash
git clone https://github.com/yourusername/invoisaic.git
cd invoisaic
```

2. **Install Dependencies**
```bash
npm run install:all
```

3. **Configure Environment**
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
# Update with your AWS credentials
```

4. **Run Development Servers**
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend (local)
cd backend
npm run dev
```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Commit Messages

Follow conventional commits:
```
type(scope): description

[optional body]
[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat(agents): add fraud detection agent

Implement new agent for detecting fraudulent invoices
using pattern recognition and anomaly detection.

Closes #123
```

### Pull Request Process

1. **Create Feature Branch**
```bash
git checkout -b feature/my-feature
```

2. **Make Changes**
- Write clean, documented code
- Follow existing code style
- Add tests for new features
- Update documentation

3. **Test Locally**
```bash
npm run test
npm run lint
npm run build
```

4. **Commit Changes**
```bash
git add .
git commit -m "feat: add new feature"
```

5. **Push to Fork**
```bash
git push origin feature/my-feature
```

6. **Create Pull Request**
- Use descriptive title
- Explain changes in description
- Reference related issues
- Add screenshots if UI changes

## Code Style

### TypeScript

- Use TypeScript strict mode
- Define proper types and interfaces
- Avoid `any` type
- Use meaningful variable names
- Add JSDoc comments for public APIs

Example:
```typescript
/**
 * Calculate optimal pricing for an invoice
 * @param invoiceData - Invoice details
 * @param customerHistory - Customer payment history
 * @returns Pricing analysis with recommendations
 */
async function calculatePricing(
  invoiceData: InvoiceData,
  customerHistory: CustomerHistory
): Promise<PricingAnalysis> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props
- Follow naming conventions

Example:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button className={cn('btn', `btn-${variant}`)} onClick={onClick}>
      {children}
    </button>
  );
}
```

### File Organization

```
src/
├── components/     # React components
│   ├── ui/        # Reusable UI components
│   └── layout/    # Layout components
├── pages/         # Page components
├── services/      # API services
├── hooks/         # Custom hooks
├── types/         # TypeScript types
├── utils/         # Utility functions
└── lib/           # Third-party integrations
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDiscount } from './pricing';

describe('calculateDiscount', () => {
  it('should calculate volume discount correctly', () => {
    const result = calculateDiscount(10000, 100);
    expect(result.percentage).toBe(10);
    expect(result.amount).toBe(1000);
  });
});
```

### Integration Tests

Test API endpoints and agent interactions:
```typescript
describe('Invoice API', () => {
  it('should create invoice with AI processing', async () => {
    const response = await createInvoice(mockData);
    expect(response.success).toBe(true);
    expect(response.data.agentProcessing).toBeDefined();
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex logic
- Include usage examples
- Keep README updated

### API Documentation

Update `docs/API.md` for API changes:
```markdown
#### New Endpoint

```http
POST /api/new-endpoint
```

**Request:**
...

**Response:**
...
```

## Areas for Contribution

### High Priority

- [ ] Additional AI agents (fraud detection, collections)
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Integration with more external services
- [ ] Performance optimizations

### Medium Priority

- [ ] Enhanced UI/UX features
- [ ] Multi-language support
- [ ] Advanced search and filtering
- [ ] Bulk operations
- [ ] Export functionality

### Good First Issues

- [ ] UI component improvements
- [ ] Documentation updates
- [ ] Test coverage improvements
- [ ] Bug fixes
- [ ] Code refactoring

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions make Invoisaic better for everyone. We appreciate your time and effort!
