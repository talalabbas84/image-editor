/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'encrypted-tbn0.gstatic.com', 'c8.alamy.com', 'res.cloudinary.com'],
  },
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
      canvas: "commonjs canvas",
    })
    return config;
  },
};

export default nextConfig;
