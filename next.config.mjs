/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tierheim-gelnhausen.org' },
      { protocol: 'https', hostname: 'www.tierschutz-hanau.de' },
      { protocol: 'https', hostname: 'www.tsv-darmstadt.de' },
      { protocol: 'https', hostname: 'www.tierheim-babenhausen-hessen.de' },
      { protocol: 'https', hostname: '**.wordpress.com' },
      { protocol: 'https', hostname: '**.wp.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
