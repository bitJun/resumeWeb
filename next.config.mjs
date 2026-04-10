/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["antd", "@ant-design/icons"]
  }
};

export default nextConfig;
