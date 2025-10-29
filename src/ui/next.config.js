/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:any*",
  //       destination: "/api/404",
  //     },
  //     {
  //       source: `/api/companies/:any*`,
  //       destination: `/api/companies/:any*`,
  //     },
  //     {
  //       source: "/:any*",
  //       destination: "/404",
  //     },
  //   ];
  // },
}
module.exports = nextConfig
