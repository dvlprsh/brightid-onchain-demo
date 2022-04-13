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
    github: {
      color: "white",
      fill: "#121212",
      position: "absolute",
      top: "0",
      border: "0",
      right: "0"
    }
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
      <Link
        href="https://github.com/dvlprsh/brightid-onchain-demo"
        className={classes.github}
      >
        <svg width="80" height="80" viewBox="0 0 250 250">
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
