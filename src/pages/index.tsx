import type { NextPage } from "next"
import Link from "next/link"
import { createTheme, ThemeProvider, Theme } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import { Paper, Box, Typography } from "@mui/material"
import React, { useEffect, useState } from "react"
import Image from "next/image"
import logo from "../img/logo.png"
import useOnChainGroups from "src/hooks/useOnChainGroups"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      flex: 1,
      position: "relative"
    },
    content: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "60%"
    },
    qrcode: {
      margin: 20
    },
    stepWrapper: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    },
    results: {
      position: "relative",
      marginTop: 20,
      width: 530,
      textAlign: "center"
    },
    link: {
      textDecoration: "underline"
    }
  })
)

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#66A8C9"
    }
  }
})

const Home: NextPage = () => {
  const classes = useStyles()
  const { memberCount } = useOnChainGroups()
  const [member, setMember] = useState<number>()
  useEffect(() => {
    ;(async () => {
      const members = await memberCount()
      if (members) {
        setMember(members)
      }
    })()
  }, [memberCount])

  return (
    <ThemeProvider theme={theme}>
      <Paper className={classes.container} elevation={0} square={true}>
        <Box className={classes.content}>
          <Box sx={{ width: 500, marginTop: 8, marginBottom: 5 }}>
            <Image src={logo} alt="Semaphore X BrihtID" layout="responsive" />
          </Box>

          <Typography variant="body1" sx={{ mb: 4 }}>
            "brightidOnchain" on-chain group has {member ? member : 0} members
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            <div>
              This is a page where you can join/leave Semaphore on-chain groups
              through proof of humanity with BrightID. The current Semaphore
              on-chain group ID is “brightidOnchain”, and group ID type is
              converted to uint in on-chain. <br /> Here, BrightID is currently
              being authenticated with minimal steps, and users can link their
              brightID and register for authentication on-chain. After that, you
              can join brightid on-chain group.
            </div>
            <div>
              (Refer to the following link for how to get Brightid verification:{" "}
              <Link href="https://brightid.gitbook.io/brightid/getting-verified">
                <a className={classes.link}>Getting-Verified</a>
              </Link>
              )
            </div>
            <h3>Join/leave on-chain Group</h3>
            First, connect your wallet to the page and have brightid on your
            mobile phone. The step of generating a unique identifier(contextId)
            is required, currently the contextId is ETH address, and a link is
            created to register the contextId to the context. This link is
            rendered as a QR code on our page. Users can receive off-chain
            authentication by scanning the QR code with their brightid. Since we
            require on-chain authentication, users submit verifications signed
            by brightid nodes to the smart contract. If the user successfully
            registers for on-chain Bright ID authentication through several
            conditions, the user can join “brightidOnchain” on-chain group.
            <h3>Leave guestBook</h3>A user with a group membership of
            “brightidOnchain” can create a guestbook for the “externalNullifier”
            provided on the current page only once. The guestbook doesn't use
            its own database and gets the logged signals as events on-chain.
            (See semaphore for more information on membership proof: {" "}
            <Link href="https://semaphore.appliedzkp.org/">
              <a className={classes.link}>Semaphore docs</a>
            </Link>
            )<h3>Mint NFT</h3>A user with a group membership of
            “brightidOnchain” can mint the NFT badge for the group
            “brightidOnchain” only once. Please note that this NFT has no
            function and is for testing purposes only.
          </Typography>
        </Box>
      </Paper>
    </ThemeProvider>
  )
}

export default Home
