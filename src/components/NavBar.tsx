import AppBar from "@mui/material/AppBar"
import Container from "@mui/material/Container"
import Toolbar from "@mui/material/Toolbar"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { useRouter } from "next/router"
import Image from "next/image"
import logo from "../img/logo.png"

export default function NavBar(): JSX.Element {
  const pages = [
    { title: "Join/Leave Group", path: "/" },
    { title: "Memebership Proof", path: "/proof" },
    { title: "Mint NFT", path: "/mint" }
  ]
  const router = useRouter()

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ width: 170, marginRight: 5}}>
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
        </Toolbar>
      </Container>
    </AppBar>
  )
}
