/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    // Will be available on both server and client
    adminprivatekey: process.env.BRIGHTID_GROUP_ADMIN_PRIVATE_KEY,
    infuraApiKey: process.env.INFURA_API_KEY
  }
}

module.exports = nextConfig
