# HVAC Website Static Site Generator

A Next.js Static Site Generator (SSG) for HVAC contractor websites. This project uses Next.js Pages Router, TypeScript, Tailwind CSS, and Supabase to generate static websites tailored for HVAC contractors.

## Features

- **Static Site Generation**: Pre-renders pages at build time for optimal performance
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Template-Based**: Customizable components specific to HVAC businesses
- **Dynamic Routing**: Company-specific pages with unique URLs
- **SEO Optimized**: Built-in meta tags and structured data
- **CMS Integration**: Pulls data from Supabase for easy content management

## Template Components

The HVAC website template includes the following components:

- Header with navigation
- Hero section with call-to-action
- Services showcase
- About section
- Customer reviews
- Location map with Google Maps integration
- Contact information and footer

## Getting Started

### Prerequisites

- Node.js 14.6.0 or newer
- A Supabase account for the database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/atlasgrowth23/atlaswebsites.git
   cd atlaswebsites
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key (optional)
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The project expects the following tables in your Supabase database:

1. `companies` - Contains HVAC company information
2. `reviews` - Customer reviews for each company

See the `types/index.ts` file for the complete data structure.

## Building for Production

To generate static sites for all companies:

```bash
npm run build
```

This will create a `out` directory with all static files ready for deployment.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.io/)
- [TypeScript](https://www.typescriptlang.org/)