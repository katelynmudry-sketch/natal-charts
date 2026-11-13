/** @type {import('next').NextConfig} */
// Static export so the app can be hosted on GitHub Pages (served from /natal-charts).
// On Vercel or locally, leave BASE_PATH unset and it runs at the site root.
const basePath = process.env.BASE_PATH ?? '';

export default {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};
