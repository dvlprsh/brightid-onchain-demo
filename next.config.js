/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    // Will be available on both server and client
    defaultNetwork: process.env.DEFAULT_NETWORK,
    adminprivatekey: process.env.BRIGHTID_GROUP_ADMIN_PRIVATE_KEY
  }
}

module.exports = nextConfig
