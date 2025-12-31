import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产构建输出独立包
  output: "standalone",
  
  // 禁用严格模式下的双重渲染（生产环境）
  reactStrictMode: true,
  
  // 图片优化配置
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
