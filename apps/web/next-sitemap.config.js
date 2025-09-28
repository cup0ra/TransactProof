/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Your production domain (no trailing slash)
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://transactproof.com',
  // Generate robots.txt alongside the sitemap
  generateRobotsTxt: true,
  // Keep a single sitemap file (disable index to avoid empty <sitemapindex/>)
  generateIndexSitemap: false,
  // Do not include API routes or admin area in sitemap
  exclude: ['/api/*', '/admin/*'],
  // Default values used by next-sitemap when transforming each route
  changefreq: 'daily',
  priority: 0.7,
  // Ensure consistent URLs (no trailing slash if Next.js app config uses defaults)
  trailingSlash: false,
  // NOTE: Do not set sourceDir for App Router projects; next-sitemap reads from .next
  // additionalPaths can be used later if certain dynamic routes need inclusion
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: path.startsWith('/blog') ? 'weekly' : 'daily',
      priority: path === '/' ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
  // Explicitly add known static routes (app router sometimes not detected)
  additionalPaths: async (config) => {
    const staticPaths = [
      '/',
      '/dashboard',
      '/disclaimer',
      '/generate',
      '/help-center',
      '/how-it-works',
      '/login',
      '/privacy',
      '/terms',
    ];
    return staticPaths.map((p) => ({
      loc: p,
      changefreq: 'daily',
      priority: p === '/' ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    }));
  },
};
