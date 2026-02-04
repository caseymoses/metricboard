# MetricBoard - Analytics Dashboard

A React TypeScript application for testing AI agent debugging capabilities. This app contains intentional bugs for the Replicant Benchmark testing framework.

## Features

- 📊 Analytics dashboard with user metrics (total users, active users, new signups)
- 👥 User management with add/delete functionality
- 🔍 User search (stub implementation)
- 📱 Responsive design with Tailwind CSS
- 🗃️ Mock API simulation
- 🎯 Intentional bugs for testing purposes

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Styling**: Tailwind CSS
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linter
npm run lint
```

## Development URL

After starting the dev server, visit: [http://localhost:5173](http://localhost:5173)

## Intentional Bugs

⚠️ **This app contains intentional bugs for AI testing purposes!**

See `BUGS.md` for detailed information about the planted bugs and how to fix them.

## Project Structure

```
src/
├── api/           # Mock API functions
├── components/    # React components
│   ├── dashboard/ # Metrics and dashboard components
│   └── users/     # User management components
├── hooks/         # Custom React hooks
├── stores/        # Zustand state stores  
├── types/         # TypeScript type definitions
└── test/          # Test utilities
```

## Bug Testing

To reset to the initial buggy state:
```bash
git reset --hard initial-buggy-state
```

## Contributing

This is a testing application. The bugs are intentional - please don't fix them unless you're testing an AI agent's debugging capabilities!