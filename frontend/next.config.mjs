import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Webpack config for PWA compatibility
  webpack: (config) => {
    return config;
  },
  // Turbopack config (empty to use defaults)
  turbopack: {},
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

export default withPWAConfig(nextConfig);
