/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://transactproof.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: ['/admin/*', '/api/*'],
  changefreq: 'daily',
  priority: 0.7,
  transform: async (config, path) => ({
    loc: path,
    changefreq: path.startsWith('/blog') ? 'weekly' : 'daily',
    priority: path === '/' ? 1.0 : 0.7,
    lastmod: new Date().toISOString(),
  }),
  generateIndexSitemap: true,
};
