/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "mkbeonizkvrzjqihhcmg.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "file.cafe24cos.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "yunshsmpcwtbkggujsem.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cddnlaekxujeuujifcgy.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
