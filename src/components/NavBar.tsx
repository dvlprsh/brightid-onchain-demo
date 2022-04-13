import { useEffect } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import AppBar from "@mui/material/AppBar"
import Container from "@mui/material/Container"
import Toolbar from "@mui/material/Toolbar"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import logo from "../img/logo.png"
import shortenAddress from "src/utils/shortenAddress"

import { useWeb3React } from "@web3-react/core"
import { InjectedConnector } from "@web3-react/injected-connector"
import { providers } from "ethers"

const pages = [
  { title: "Join/Leave Group", path: "/" },
  { title: "Memebership Proof", path: "/proof" },
  { title: "Mint NFT", path: "/mint" }
]

const injectedConnector = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42]
})

export default function NavBar(): JSX.Element {
  const router = useRouter()
  const { activate, account } = useWeb3React<providers.Web3Provider>()

  useEffect(() => {
    ;(async () => {
      if (await injectedConnector.isAuthorized()) {
        await activate(injectedConnector)
      }
    })()
  }, [activate])

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ width: 170, marginRight: 5 }}>
            <Image src={logo} alt="interep X BrihtID" layout="responsive" />
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page.title}
                onClick={() => router.push(page.path)}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                {page.title}
              </Button>
            ))}
          </Box>
          {account ? (
            <Button variant="outlined" color="secondary">
              {shortenAddress(account)}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => activate(injectedConnector)}
            >
              Connect Wallet
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  )
}
