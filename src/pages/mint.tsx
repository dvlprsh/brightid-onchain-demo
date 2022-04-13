import type { NextPage } from "next"
import { Theme } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import detectEthereumProvider from "@metamask/detect-provider"
import { Link } from "@mui/material"
import { Signer, ethers } from "ethers"
import { LoadingButton } from "@mui/lab"
import {
  Paper,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  StepContent
} from "@mui/material"
import React, { useEffect, useState } from "react"
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
    },
  })
)

const Mint: NextPage = () => {
  const classes = useStyles()

  const [_ethereumProvider, setEthereumProvider] = useState<any>()
  const [_activeStep, setActiveStep] = useState<number>(0)
  const [_error, setError] = useState<
    { errorStep: number; message?: string } | undefined
  >()
  const [account, setAccount] = useState<string>()
  const [_signer, setSigner] = useState<Signer>()

  const {
    mintNFT,
    loading,
    etherscanLink,
    transactionstatus
  } = useOnChainGroups()
  useEffect(() => {
    ;(async function IIFE() {
      if (!_ethereumProvider) {
        const ethereumProvider = (await detectEthereumProvider()) as any

        if (ethereumProvider) {
          setEthereumProvider(ethereumProvider)

          const ethersProvider = new ethers.providers.Web3Provider(
            ethereumProvider
          )
          const signer = ethersProvider && ethersProvider.getSigner()
          setSigner(signer)
        } else {
          console.error("Please install Metamask!")
        }
      } else {
        const accounts = await _ethereumProvider.request({
          method: "eth_accounts"
        })
        const account = accounts[0]
        setAccount(account)

        if (account) {
          setActiveStep(1)
        }

        _ethereumProvider.on("accountsChanged", (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
            setActiveStep(0)
          }
        })
      }
    })()
  }, [_ethereumProvider])

  async function connect() {
    const accounts = await _ethereumProvider.request({ method: "eth_requestAccounts" })
    await _ethereumProvider.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: "0x2a" // kovan
        }
      ]
    })
    setAccount(accounts[0])
    handleNext()
  }

  const mintNft = async () => {
    try{
    _signer && await mintNFT(_signer)


    } catch (e) {
      setError({
        errorStep: _activeStep,
        message: "mint failed - " + e
      })
    }
  }

  function handleNext() {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
    setError(undefined)
  }

  return (
    <Paper className={classes.container} elevation={0} square={true}>
      <Box className={classes.content}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Interep On-chain group
        </Typography>

        <Typography variant="body1" sx={{ mb: 4 }}>
          Membership Proof
        </Typography>

        <Stepper activeStep={_activeStep} orientation="vertical">
          <Step>
            <StepLabel error={_error?.errorStep === 0}>
              Connect your wallet with Metamask
            </StepLabel>
            <StepContent style={{ width: 400 }}>
              <Button
                fullWidth
                onClick={() => connect()}
                variant="outlined"
                disabled={!_ethereumProvider}
              >
                Connect wallet
              </Button>
            </StepContent>
          </Step>
          <Step>
            <StepLabel error={_error?.errorStep === 1}>
              Mint NFT
            </StepLabel>
            <StepContent style={{ width: 400 }}>
              <Button
                fullWidth
                onClick={mintNft}
                variant="outlined"
              >
                Mint NFT
              </Button>
            </StepContent>
          </Step>
        </Stepper>
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
