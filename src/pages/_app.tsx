import "../styles/globals.css"
import { Web3ReactProvider } from "@web3-react/core"
import { providers } from "ethers"
import type { AppProps } from "next/app"
import Head from "next/head"
import { ThemeProvider } from "@mui/material/styles"
import theme from "src/styles/theme"
import NavBar from "src/components/NavBar"

function App({ Component, pageProps }: AppProps) {
  function getLibrary(provider: any) {
    return new providers.Web3Provider(provider)
  }

  return (
    <>
      <Head>
        <title>BrightID onchain group | Interep</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <Web3ReactProvider getLibrary={(provider) => getLibrary(provider)}>
        <ThemeProvider theme={theme}>
          <NavBar />
          <Component {...pageProps} />
        </ThemeProvider>
      </Web3ReactProvider>
    </>
  )
}

export default App
