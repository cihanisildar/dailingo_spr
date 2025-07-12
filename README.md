# Dailingo - Spaced Repetition Flashcards

Dailingo is a web application that helps users learn and remember words effectively using spaced repetition. Users can create word lists, add word cards with definitions, and practice them using a spaced repetition system.

## Features

- User authentication with Google
- Create and manage word lists
- Add word cards with definitions
- Spaced repetition review system
- Daily review sessions with words from different intervals (1 day, 1 week, 1 month, 1 year)

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- NextAuth.js for authentication
- PostgreSQL with Prisma ORM
- Google OAuth for authentication

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables:
     - `NEXT_PUBLIC_API_URL`: Your API server URL (e.g., https://api.repeeker.com)
     - `NEXTAUTH_SECRET`: A random string for session encryption
     - `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
     - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
     - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret

4. Set up the database:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Setting up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google OAuth2 API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
6. Copy the Client ID and Client Secret to your `.env` file

## Database Schema

The application uses the following main models:

- `User`: Stores user information and authentication details
- `WordList`: Represents a collection of related words
- `Card`: Stores individual word cards with spaced repetition metadata

## API Configuration

This application makes direct API calls to the backend server. Ensure your backend server (nginx) is configured with proper CORS headers to allow requests from your frontend domain.

### Required nginx CORS configuration:
```nginx
add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
```

### Environment Variables:
- `NEXT_PUBLIC_API_URL`: Set this to your backend API server URL (e.g., https://api.repeeker.com)

## Contributing

Feel free to open issues and pull requests to improve the application.
