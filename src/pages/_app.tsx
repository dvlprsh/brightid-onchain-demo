import "../styles/globals.css"
import type { AppProps } from "next/app"
import Head from "next/head"
import { ThemeProvider } from "@mui/material/styles"
import theme from "src/styles/theme"
import NavBar from "src/components/NavBar"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>BrightID onchain group | Interep</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <ThemeProvider theme={theme}>
        <NavBar />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}

export default MyApp
