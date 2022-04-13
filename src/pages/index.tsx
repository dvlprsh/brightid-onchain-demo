import type { NextPage } from "next"
import { createTheme, ThemeProvider, Theme } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import {
  Paper,
  Box,
  Typography
} from "@mui/material"
import React from "react"

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
      alignItems: "center"
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

  return (
    <ThemeProvider theme={theme}>
      <Paper className={classes.container} elevation={0} square={true}>
        <Box className={classes.content}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Interep On-chain group with BrightID
          </Typography>

          <Typography variant="body1" sx={{ mb: 4 }}>
            "brightidv1" on-chain group has {} members
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
          <div>This is a page where you can join/leave Interep on-chain groups through proof of humanity with BrightID.</div>
          <div>The current interep on-chain group ID is “brightidv1”, and group ID type is converted to uint in on-chain.</div>
          <div>Here, BrightID is currently being authenticated with minimal steps,</div>
          <div>and users can link their brightID and register for authentication on-chain.</div>
          <div>After that, you can join interep-brightid on-chain group.</div>
          <div>(Refer to the following link for how to get Brightid verification: Getting-Verified)</div>

<h3>Join/leave on-chain Group</h3>
First, connect your wallet to the page and have brightid on your mobile phone.
The step of generating a unique identifier(contextId) is required,
currently the contextId is ETH address, and a link is created to register the contextId to the context(interep here).
This link is rendered as a QR code on our page.
Users can receive off-chain authentication by scanning the QR code with their brightid.
Since we require on-chain authentication, users submit verifications signed by brightid nodes to the smart contract.
If the user successfully registers for on-chain Bright ID authentication through several conditions,
the user can join “brightidv1” on-chain group.

<h3>Leave guestBook</h3>
A user with a group membership of “brightidv1” can create a guestbook for the “externalNullifier” provided on the current page only once.
The guestbook doesn't use its own database and gets the logged signals as events on-chain.
(See semaphore for more information on membership proof: Semaphore docs)

<h3>Mint NFT</h3>
A user with a group membership of “brightidv1” can mint the NFT badge for the group “brightidv1” only once.
Please note that this NFT has no function and is for testing purposes only.
          </Typography>
        </Box>
      </Paper>
    </ThemeProvider>
  )
}

export default Home
