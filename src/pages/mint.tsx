import type { NextPage } from "next"
import { Theme } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import { Link } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import {
  Paper,
  Box,
  Typography,
  Button,
} from "@mui/material"
import React, { useEffect, useState } from "react"
import useOnChainGroups from "src/hooks/useOnChainGroups"
import useSigner from "src/hooks/useSigner"

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
    qrmodal: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "300px",
      height: "300px",
      backgroundColor: "white"
    },
    qrcode: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)"
    },
    results: {
      position: "relative",
      marginTop: 20,
      width: 530,
      textAlign: "center"
    }
  })
)

const Mint: NextPage = () => {
  const classes = useStyles()

  const [_activeStep, setActiveStep] = useState<number>(0)
  const [_error, setError] = useState<
    { errorStep: number; message?: string } | undefined
  >()
  const _signer = useSigner()

  const { mintNFT, loading, etherscanLink, transactionstatus } =
    useOnChainGroups()

  const mintNft = async () => {
    try {
      _signer && (await mintNFT(_signer))
    } catch (e) {
      setError({
        errorStep: _activeStep,
        message: "mint failed - " + e
      })
    }
  }

  const refreshPage = () => {
    window.location.reload()
  }

  return (
    <Paper className={classes.container} elevation={0} square={true}>
      <Box className={classes.content}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Mint NFT
        </Typography>

        <Typography variant="body1" sx={{ mb: 4 }}>
          Those with group membership can mint “brightidv2-nft” badge(only once)
        </Typography>

        {transactionstatus !== undefined ? (
          <Box>
            <Typography variant="body1">
              Transaction {!!transactionstatus ? "Successful" : "Failed"}{" "}
              (Check the&nbsp;
              <Link
                href={etherscanLink}
                underline="hover"
                rel="noreferrer"
                target="_blank"
              >
                transaction
              </Link>
              )
            </Typography>
            <Button fullWidth onClick={refreshPage} variant="outlined">
              Home
            </Button>
          </Box>
        ) : (
            <LoadingButton
              fullWidth
              onClick={mintNft}
              variant="outlined"
              loading={loading}
            >
              Mint NFT
            </LoadingButton>
          )}

        {_error && (
          <Paper className={classes.results} sx={{ p: 3 }}>
            {_error.message && (
              <Typography variant="body1">{_error.message}</Typography>
            )}
          </Paper>
        )}
      </Box>
    </Paper>
  )
}

export default Mint
