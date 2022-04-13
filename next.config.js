/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    // Will be available on both server and client
    adminprivatekey: process.env.BRIGHTID_GROUP_ADMIN_PRIVATE_KEY,
    infuraApiKey: process.env.INFURA_API_KEY,
    brightIdApiKey: process.env.BRIGHTID_API_PRIVATE_KEY,
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  }
}

module.exports = nextConfig
