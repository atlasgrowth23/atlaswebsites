# Architecture Overview

## Overview

This project is a Static Site Generator (SSG) for HVAC contractor websites built using Next.js with the Pages Router, TypeScript, and Tailwind CSS. The application fetches data from Supabase and pre-renders pages at build time to generate static websites tailored for HVAC contractors. It follows a template-based approach where company-specific data is injected into pre-designed UI components.

## System Architecture

### Frontend Architecture

The system uses Next.js with the Pages Router as the core framework, enabling static site generation (SSG) capabilities. The architecture follows a component-based design pattern with a clear separation between UI components, templates, and pages.

- **Pages Router**: Used for routing and rendering pages through the `/pages` directory
- **Static Site Generation**: Leverages Next.js's `getStaticPaths` and `getStaticProps` for pre-rendering pages at build time
- **TypeScript**: Used throughout the codebase for type safety
- **Tailwind CSS**: Used for styling with utility-first approach

The project structure separates concerns into:
- `/pages`: Contains page components and routing logic
- `/components`: Houses reusable UI components
- `/lib`: Contains utility functions and service integrations
- `/public`: Stores static assets like images
- `/styles`: Contains global CSS and styling utilities
- `/types`: Defines TypeScript interfaces

### Backend Architecture

The application doesn't include traditional server-side components. Instead, it uses:

- **Supabase**: As a backend-as-a-service (BaaS) for data storage and retrieval
- **Next.js API Routes**: Not currently implemented but available for future extensions

Data is fetched at build time via Supabase client to generate static pages, eliminating the need for server-side rendering at runtime.

### Data Flow

1. During the build process, Next.js executes `getStaticPaths` to determine which company pages to pre-render
2. For each path, `getStaticProps` fetches company and review data from Supabase
3. The data is passed as props to page components, which render the content using template components
4. The resulting HTML is generated at build time and served as static files

## Key Components

### Templates

The project uses a template-based approach with components specifically designed for HVAC businesses:

- **TemplateHVAC1**: A collection of components forming a complete HVAC website template:
  - `Header.tsx`: Navigation and logo display
  - `Hero.tsx`: Main banner with company information and call-to-action
  - `Services.tsx`: Displays HVAC services offered
  - `About.tsx`: Company description and information
  - `ReviewsSection.tsx`: Customer testimonials and ratings
  - `LocationMap.tsx`: Google Maps integration showing business location
  - `ContactFooter.tsx`: Contact information and footer

### UI Components

The project uses a combination of custom UI components and those from shadcn/ui:

- `Button`: Reusable button component with variants
- `Card`: Container component for displaying content in cards
- `Input`: Form input component
- `Textarea`: Multi-line text input component
- `Label`: Form label component

### Utilities

- `lib/supabase/client.ts`: Utility for creating and configuring Supabase client
- `lib/utils.ts`: General utility functions including CSS class merging and color conversions
- `lib/colors.ts`: Color utility functions for determining contrast colors
- `lib/palettes.ts`: Color palette management for company branding

## Data Models

The application uses two primary data models:

### Company

Represents an HVAC business with properties like:
- Basic information (name, slug, phone, address)
- Location data (city, state, latitude, longitude, place_id)
- Business metrics (rating, reviews count)
- Operating details (working hours)
- Brand assets (logo, colors)
- Social media links

### Review

Represents customer reviews for an HVAC company:
- Review content (text, stars)
- Reviewer information (name, image)
- Metadata (review_id, published date)
- Response information (response text, response date)

## External Dependencies

### Supabase Integration

- **Authentication**: Not currently implemented but available through Supabase Auth
- **Database**: Used for storing company and review data
- **Storage**: Could be used for storing company logos and images (not fully implemented)

### Google Maps

- Optional integration for displaying company locations via the `LocationMap` component
- Requires a Google Maps API key set as an environment variable

## Deployment Strategy

The application is configured for deployment on platforms that support Next.js static site generation:

- **Build Process**: `next build` generates static files
- **Output**: Static HTML, CSS, and JavaScript files are produced
- **Hosting**: Can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.)

### Environment Configuration

- `.env.local`: Contains environment variables for Supabase URL, Supabase anonymous key, and optionally Google Maps API key
- These variables are used during the build process to fetch data and configure external services

## Future Considerations

1. **Dynamic Data Updates**: The current architecture doesn't support real-time data updates without rebuilding the site
2. **User Authentication**: Could be implemented for admin access to update company information
3. **Additional Templates**: The architecture supports adding more templates beyond TemplateHVAC1
4. **Content Management**: A dedicated CMS interface could be added to allow non-technical users to update content
5. **Analytics**: Integration with analytics platforms to track website performance and user behavior

## Architectural Decisions

### Static Site Generation vs. Server-Side Rendering

- **Decision**: Use Static Site Generation (SSG) instead of Server-Side Rendering (SSR)
- **Rationale**: HVAC company websites typically have content that doesn't change frequently. SSG provides better performance, security, and cost-efficiency for this use case.
- **Tradeoffs**: Less real-time dynamic content capabilities, but significantly better performance and lower hosting costs

### Supabase as Backend

- **Decision**: Use Supabase as a backend-as-a-service rather than building a custom backend
- **Rationale**: Simplifies development by providing ready-made solutions for data storage and retrieval, eliminating the need for a custom server implementation
- **Tradeoffs**: Some limitations in customization compared to a custom backend, but faster development and less maintenance

### Template-Based Approach

- **Decision**: Use a template-based architecture with pre-designed components
- **Rationale**: Allows for consistent design across HVAC websites while enabling customization through data
- **Tradeoffs**: Less flexibility for completely custom designs, but much faster and more cost-effective to develop and maintain