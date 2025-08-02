# Project Structure

## Root Directory Organization
```
Qonect/
├── .kiro/                  # Kiro spec-driven development files
│   ├── steering/          # Project steering documents
│   └── specs/             # Feature specifications
├── client/                # Frontend React application
├── server/                # Backend Express.js API
├── shared/                # Shared TypeScript types and utilities
├── docs/                  # Project documentation
├── .gitignore            # Git ignore patterns
├── README.md             # Project overview and setup
├── package.json          # Root package.json for workspace
└── CLAUDE.md             # Claude Code project instructions
```

## Frontend Structure (`client/`)
```
client/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Basic UI primitives
│   │   ├── forms/        # Form-related components
│   │   └── interview/    # Interview-specific components
│   ├── pages/            # Route-level page components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API clients and external services
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── contexts/         # React Context providers
│   └── assets/           # Static assets (images, icons)
├── public/               # Public static files
├── index.html           # HTML entry point
├── package.json         # Frontend dependencies
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

## Backend Structure (`server/`)
```
server/
├── src/
│   ├── routes/           # Express route handlers
│   ├── controllers/      # Business logic controllers
│   ├── services/         # External service integrations
│   ├── middleware/       # Express middleware functions
│   ├── models/           # Database models (Prisma)
│   ├── utils/            # Server utility functions
│   └── types/            # Server-side TypeScript types
├── prisma/               # Database schema and migrations
├── uploads/              # Temporary file upload directory
├── .env.example         # Environment variables template
├── package.json         # Backend dependencies
└── tsconfig.json        # TypeScript configuration
```

## Shared Directory (`shared/`)
```
shared/
├── types/                # Shared TypeScript interfaces
├── constants/            # Application constants
├── validators/           # Input validation schemas
└── utils/                # Cross-platform utilities
```

## Code Organization Patterns
- **Feature-First**: Components organized by functionality rather than type
- **Atomic Design**: UI components follow atomic design principles (atoms → molecules → organisms)
- **Service Layer**: Business logic separated from UI components
- **Custom Hooks**: Reusable logic extracted into custom React hooks
- **Type Safety**: Comprehensive TypeScript usage throughout

## File Naming Conventions
- **Components**: PascalCase (`InterviewSession.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useInterviewTimer.ts`)
- **Services**: camelCase (`interviewService.ts`)
- **Types**: PascalCase for interfaces (`InterviewSession.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Utilities**: camelCase (`formatTimer.ts`)

## Import Organization
```typescript
// 1. External libraries
import React from 'react'
import { useState, useEffect } from 'react'

// 2. Internal modules (absolute imports)
import { InterviewService } from '@/services/interviewService'
import { InterviewSession } from '@/types/interview'

// 3. Relative imports
import './InterviewPage.css'
```

## Key Architectural Principles
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data
- **Dependency Injection**: Services injected rather than directly imported in components
- **Error Boundaries**: Comprehensive error handling at component and service levels
- **Performance**: Code splitting and lazy loading for optimal bundle size
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Security**: Input validation, sanitization, and secure file handling

## Configuration Files Location
- **Environment Variables**: `.env` files in respective directories
- **TypeScript Config**: `tsconfig.json` in root and subdirectories
- **Linting**: `.eslintrc.js` in root directory
- **Build Config**: `vite.config.ts` (frontend), custom scripts (backend)
- **Database**: `prisma/schema.prisma` for database schema