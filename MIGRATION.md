# Migration Guide: Next.js API Routes to Node.js Backend

## Overview
This project has been migrated from using Next.js API routes to a separate Node.js backend. The backend runs on port 3001 and all API calls are now made through React hooks.

## Changes Made

1. Removed Next.js API routes from `/app/api`
2. Created new hooks in `/hooks` directory:
   - `useApi.ts` - Base API client
   - `useAuth.ts` - Authentication hooks
   - `useCards.ts` - Flashcard management
   - `useLists.ts` - Word list management
   - `useTest.ts` - Test session management
   - `useReview.ts` - Review session management
   - `useStats.ts` - User statistics

## Environment Setup

Add the following to your `.env` file:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

The Node.js backend implements the following endpoints:

### Authentication
- POST `/auth/login`
- POST `/auth/register`
- GET `/user`
- PUT `/user/profile`
- DELETE `/user/delete`

### Cards
- GET `/cards`
- GET `/cards/:id`
- POST `/cards`
- PUT `/cards/:id`
- DELETE `/cards/:id`
- GET `/cards/today`
- GET `/cards/upcoming`
- GET `/cards/stats`
- POST `/word-result`

### Lists
- GET `/lists`
- GET `/lists/:id`
- POST `/lists`
- PUT `/lists/:id`
- DELETE `/lists/:id`
- GET `/lists/:id/cards`
- GET `/lists/:id/available-cards`
- POST `/lists/:id/cards`
- POST `/lists/:id/remove-cards`

### Test Sessions
- POST `/test-session`
- POST `/test-session/:id/results`
- GET `/test-session/:id`
- GET `/test-history`

### Review Sessions
- POST `/review-session`
- POST `/review-session/:id/results`
- GET `/review-session/:id`
- GET `/review-session/history`
- GET `/review-schedule`

### Statistics
- GET `/streak`

## Usage Example

```typescript
import { useCards } from '@/hooks/useCards';

function MyComponent() {
  const { getCards, createCard } = useCards();

  const handleCreateCard = async () => {
    try {
      const newCard = await createCard({
        word: 'example',
        definition: 'a representative form or pattern'
      });
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    // Your component JSX
  );
}
```

## Error Handling

All API calls through hooks will throw errors if the request fails. Make sure to wrap API calls in try-catch blocks:

```typescript
try {
  const data = await someApiCall();
  // Handle success
} catch (error) {
  // Handle error
  console.error('API call failed:', error);
}
```

## Authentication

The API client automatically includes credentials in requests. Make sure your Node.js backend is configured to handle CORS and cookies properly. 