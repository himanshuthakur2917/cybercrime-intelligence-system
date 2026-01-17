/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ciayixiteesyoozjpiln.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3C5NezXskEJ3HtICxRn1hQ_hqkEDgd-',
  },
  // Enable src directory
  experimental: {
    // This allows Next.js to find pages in src/pages
  },
};

module.exports = nextConfig;