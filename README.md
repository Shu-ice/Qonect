# Qonect

Qonect is an interview practice application built with Next.js, designed to help users prepare for job interviews through interactive practice sessions.

## Features

- Interactive interview practice sessions
- Voice recording capabilities
- Parental consent system for younger users
- Premium features and subscription options
- PWA (Progressive Web App) support
- Authentication system

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma with SQLite
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Shu-ice/Qonect.git
cd Qonect
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
Qonect/
├── interview-practice-app/    # Main Next.js application
│   ├── src/
│   │   ├── app/              # App router pages
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   └── types/           # TypeScript type definitions
│   ├── prisma/              # Database schema
│   └── public/              # Static assets
├── prisma/                   # Root level Prisma schema
└── public/                   # Root level public assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need support, please open an issue on GitHub. 