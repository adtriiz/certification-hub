# Certification Hub

A comprehensive platform for browsing, managing, and tracking professional certifications. This project streamlines the process of finding the right certifications and managing funding requests.

## Features

- **Certification Catalog**: Browse a wide range of certifications with details on domain, technology, level, and price.
- **Admin Dashboard**: Centralized management for administrators to:
  - Synchronize certification data from Google Sheets.
  - Track user enrollment and completion statistics.
  - Review and approve/reject certification funding applications.
- **Google Sheets Integration**: Robust sync logic that maps spreadsheet data directly to the Supabase database.
- **Persistent Settings**: Admin configurations (like Sheet ID and GID) are stored for a seamless experience.
- **Authentication**: Secure login and role-based access control using Supabase Auth.

## Tech Stack

- **Frontend**: React (with Vite), TypeScript, Tailwind CSS.
- **UI Components**: shadcn/ui (Radix UI primitives).
- **Backend/Database**: Supabase (Postgres, Auth, Edge Functions).
- **State Management**: TanStack Query (React Query).
- **Icons**: Lucide React.

## Getting Started

### Prerequisites

- Node.js & npm (or bun) installed.
- A Supabase project with the required schema.

### Setup

1. **Clone the repository**:
   ```sh
   git clone <YOUR_GIT_URL>
   cd certification-hub
   ```

2. **Install dependencies**:
   ```sh
   npm install
   # or
   bun install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**:
   ```sh
   npm run dev
   ```

## Project Structure

- `src/components`: Reusable UI components and feature-specific logic.
- `src/pages`: Main application views (Index, AdminDashboard, Login, etc.).
- `src/integrations/supabase`: Supabase client configuration and types.
- `src/hooks`: Custom React hooks for data fetching and authentication.
- `src/types`: TypeScript interfaces and type definitions.

## License

This project is licensed under the MIT License.
