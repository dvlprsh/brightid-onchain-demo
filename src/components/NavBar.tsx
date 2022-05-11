import React, { useEffect } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import AppBar from "@mui/material/AppBar"
import Container from "@mui/material/Container"
import Toolbar from "@mui/material/Toolbar"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Link from "@mui/material/Link"
import logo from "../img/logo.png"
import shortenAddress from "src/utils/shortenAddress"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Tooltip from "@mui/material/Tooltip"

import { useWeb3React } from "@web3-react/core"
import { InjectedConnector } from "@web3-react/injected-connector"
//import { NetworkConnector} from "@web3-react/network-connector"
import { providers } from "ethers"

const pages = [
  { title: "Guest Book", path: "/guestbook" },
  { title: "Mint NFT", path: "/mint" }
]

const injectedConnector = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42]
})

// const network = new NetworkConnector({
//   urls: {
//     //42: 'http://localhost:3000',
//   },
//   defaultChainId: 42,
// })

export default function NavBar(): JSX.Element {
  const router = useRouter()
  const { activate, account } = useWeb3React<providers.Web3Provider>()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const copyAccount = async () => {
    account && (await navigator.clipboard.writeText(account))
  }

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
          <Box
            sx={{ width: 100, marginRight: 5, marginLeft: 2 }}
            onClick={() => router.push("/")}
          >
            <Image src={logo} alt="Semaphore X BrihtID" layout="responsive" />
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button
              onClick={() => router.push("/join")}
              sx={{ my: 2, color: "white", display: "block", marginRight: 1 }}
            >
              Join/Leave Group
            </Button>
            <Button
              onClick={handleClick}
              sx={{ color: "white" }}
              endIcon={<KeyboardArrowDownIcon />}
            >
              Membership Proof
            </Button>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              {pages.map((page) => (
                <MenuItem
                  key={page.title}
                  onClick={() => {
                    router.push(page.path)
                    handleClose()
                  }}
                >
                  {page.title}
                </MenuItem>
              ))}
            </Menu>
          </Box>
          {account ? (
            <Tooltip disableFocusListener disableTouchListener title="Copy">
              <Button
                variant="outlined"
                color="primary"
                onClick={copyAccount}
                sx={{ marginRight: 10 }}
              >
                {shortenAddress(account)}
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => activate(injectedConnector)}
              sx={{ marginRight: 10 }}
            >
              Connect Wallet
            </Button>
          )}
        </Toolbar>
      </Container>
      <Link
        href="https://github.com/dvlprsh/brightid-onchain-demo"
        sx={{
          color: "black",
          fill: "white",
          position: "absolute",
          right: "0"
        }}
      >
        <svg width="65" height="65" viewBox="0 0 250 250">
          <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
          <path
            fill="currentColor"
            d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
          ></path>
          <path
            fill="currentColor"
            d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
          ></path>
        </svg>
      </Link>
    </AppBar>
  )
}
