# Job Tracker Frontend

React SPA for the Job Tracker application.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **@dnd-kit** for drag-and-drop

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:3001
```

## Project Structure

```
src/
├── api/           # API client and service modules
├── components/
│   ├── common/    # Reusable UI components
│   ├── layout/    # Page layouts
│   └── applications/  # Application-specific components
├── contexts/      # React contexts (auth)
├── hooks/         # Custom hooks
├── pages/         # Page components
├── routes/        # Routing configuration
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
