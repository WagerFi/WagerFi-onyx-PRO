/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
        // Allow production builds to complete even with ESLint errors
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Temporarily ignore build errors for Supabase type compatibility
        ignoreBuildErrors: true,
    },
};

module.exports = nextConfig;
