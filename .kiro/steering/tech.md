# Technology Stack

## Architecture
- **Pattern**: Single Page Application (SPA) with RESTful API backend
- **Deployment**: Web-based application with responsive design for desktop and mobile
- **Data Flow**: Client-side file processing for PDFs, server-side AI processing for conversations

## Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: React Context API + useReducer for global state
- **Audio Processing**: Web Audio API for voice input/output
- **PDF Processing**: PDF.js for client-side PDF text extraction
- **Icons**: Lucide React for consistent iconography

## Backend
- **Language**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **AI Integration**: OpenAI GPT-4 API for conversation generation
- **Authentication**: JWT-based session management
- **File Upload**: Multer for handling PDF uploads
- **Environment**: dotenv for configuration management

## Database
- **Primary**: SQLite for development, PostgreSQL for production
- **ORM**: Prisma for type-safe database operations
- **Schema**: User sessions, conversation history, practice statistics

## Development Environment
- **Node.js**: Version 18+ required
- **Package Manager**: npm or yarn
- **Code Quality**: ESLint + Prettier for consistent formatting
- **Testing**: Jest for unit tests, Playwright for E2E testing
- **Type Checking**: TypeScript strict mode enabled

## Common Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## Environment Variables
```bash
# API Configuration
OPENAI_API_KEY=         # OpenAI API key for GPT integration
API_BASE_URL=           # Backend API base URL

# Database
DATABASE_URL=           # Database connection string
JWT_SECRET=             # JWT signing secret

# File Upload
MAX_FILE_SIZE=          # Maximum PDF file size (default: 10MB)
UPLOAD_DIR=             # Directory for temporary file storage
```

## Port Configuration
- **Frontend Dev Server**: 5173 (Vite default)
- **Backend API Server**: 3000
- **Database**: 5432 (PostgreSQL) / file-based (SQLite)

## External Services
- **OpenAI API**: For conversational AI and interview question generation
- **Web Speech API**: For browser-based voice recognition
- **File System**: Local storage for temporary PDF processing