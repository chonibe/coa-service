# Environment Variables

The following environment variables are required for the application to function properly:

## Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

## Application Configuration
- `NEXT_PUBLIC_APP_URL`: The URL of your application (e.g., http://localhost:3000 for development)

To set up your environment variables:

1. Create a `.env.local` file in the root directory
2. Add the required variables with your actual values
3. For production, make sure to set these variables in your deployment platform (e.g., Vercel)

Example `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
``` 