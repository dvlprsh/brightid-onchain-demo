/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    // Will be available on both server and client
    adminprivatekey: process.env.BRIGHTID_GROUP_ADMIN_PRIVATE_KEY,
    infuraApiKey: process.env.INFURA_API_KEY,
    brightIdApiKey: process.env.BRIGHTID_API_PRIVATE_KEY,
    root: __dirname
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Important: return the modified config
    config.module.rules.push({
      test: /\.(zkey|wasm)$/i,
      loader: "file-loader",
      options: {
        //publicPath: './dist/',
        name: '[name].[ext]',
      }
    })

    return config
  },
  typescript: {
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig
