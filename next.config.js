/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    // Will be available on both server and client
    adminprivatekey: process.env.BRIGHTID_GROUP_ADMIN_PRIVATE_KEY,
    infuraApiKey: process.env.INFURA_API_KEY,
    brightIdApiKey: process.env.BRIGHTID_API_PRIVATE_KEY,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!isServer) {
        config.plugins.push(
            new webpack.ProvidePlugin({
                global: "global"
            })
        )

        config.resolve.fallback = {
            fs: false,
            stream: false,
            crypto: false,
            assert: false,
            os: false,
            readline: false,
            ejs: false,
            assert: require.resolve("assert"),
            path: false
        }

        return config
    }

    return config
}
}

module.exports = nextConfig
