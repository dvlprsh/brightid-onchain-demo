import type { NextPage } from "next"
import { createTheme, ThemeProvider, Theme } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import detectEthereumProvider from "@metamask/detect-provider"
import QRCode from "qrcode.react"
import { Modal, Link } from "@mui/material"
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
import React, { useCallback, useEffect, useState } from "react"
import { useInterval } from "usehooks-ts"
import useOnChainGroups from "src/hooks/useOnChainGroups"
import getNextConfig from "next/config"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      flex: 1,
      position: "relative",
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

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#66A8C9"
    }
  }
})

const NODE_URL = "http:%2f%2fnode.brightid.org"
const CONTEXT = "interep"
const ETHERSCAN_API_KEY = getNextConfig().publicRuntimeConfig.etherscanApiKey

const Home: NextPage = () => {
  const classes = useStyles()

  const [_ethereumProvider, setEthereumProvider] = useState<any>()
  const [_activeStep, setActiveStep] = useState<number>(0)
  const [_error, setError] = useState<
    { errorStep: number; message?: string } | undefined
  >()
  const [_loading, setLoading] = useState<boolean>(false)
  const [_open, setOpen] = useState<boolean>(false)
  const [url, setUrl] = useState<string>()
  const [account, setAccount] = useState<string>()
  const [verified, setVerified] = useState<boolean>(false)
  const [_signer, setSigner] = useState<Signer>()
  const [_identityCommitment, setIdentityCommitment] = useState<string>()
  const [_transactionSuccess, setTransactionSuccess] = useState<boolean>(false)
  const [_pending, setPending] = useState<boolean>()

  const {
    groupId,
    signMessage,
    retrieveIdentityCommitment,
    joinGroup,
    leaveGroup,
    transactionHash,
    hasjoined,
    loading
  } = useOnChainGroups()

  useEffect(() => {
    ;(async () => {
      setError(undefined)

      try {
        if (_activeStep === 1 && account) {
          await checkVerification(account)
        }
      } catch (e) {}
    })()
  }, [_activeStep, account])

  useEffect(() => {
    !!transactionHash && setPending(true)
  }, [transactionHash])

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
        setUrl(
          `brightid://link-verification/${NODE_URL}/${CONTEXT}/${accounts}`
        )

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

  async function getBrightIdUserData(address: string) {
    const response = await fetch(
      `https://app.brightid.org/node/v5/verifications/${CONTEXT}/${address}`
    )
    return response.json()
  }

  async function getTransactionStatus(txHash: string) {
    const response = await fetch(
      // `https://api-kovan.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}` // kovan
      `https://api-ropsten.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}` // ropsten
    )
    return response.json()
  }

  const checkTransactionStatus = useCallback(async (txHash: string) => {
    const transactionStatus = await getTransactionStatus(txHash)
    const status = transactionStatus.result.status

    if (status === "1") {
      setPending(false)
      setTransactionSuccess(true)
      setLoading(false)
      handleNext()
      console.log("transaction success")
    } else if (status === "0") {
      setPending(false)
      setTransactionSuccess(false)
      setLoading(false)
      handleNext()
      console.log("transaction failed")
    } else if (status === "") {
      setPending(true)
    } else {
      setPending(true)
      console.log("no txhash yet")
    }
  }, [])

  useInterval(
    () => {
      const txHash = transactionHash
      checkTransactionStatus(txHash)
    },
    transactionHash && _pending === true ? 2000 : null
  )

  const generateIdentity = async () => {
    try {
      const identityCommitment =
        _signer && (await retrieveIdentityCommitment(_signer))

      if (!identityCommitment) return

      setIdentityCommitment(identityCommitment)
      identityCommitment && setActiveStep(3)
    } catch (e) {
      setError({
        errorStep: _activeStep,
        message: "generate identity Failed - " + e
      })
    }
  }

  const joinOnChainGroup = async () => {
    try {
      if (!_signer || !_identityCommitment) return

      setLoading(true)
      const userSignature = await signMessage(_signer, _identityCommitment)

      if (userSignature) {
        await joinGroup(_identityCommitment)
      }
    } catch (e) {
      setError({ errorStep: _activeStep, message: "join group Failed - " + e })
      setLoading(false)
    }
  }

  const leaveOnchainGroup = async () => {
    try {
      if (!_signer || !_identityCommitment) return

      setLoading(true)
      const userSignature = await signMessage(_signer, _identityCommitment)

      if (userSignature) {
        await leaveGroup(_identityCommitment)
      }
    } catch (e) {
      setError({ errorStep: _activeStep, message: "leave group Failed - " + e })
      setLoading(false)
    }
  }

  function handleNext() {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
    setError(undefined)
  }
  function handleOpen() {
    setOpen(true)
  }
  function handleClose() {
    setOpen(false)
  }

  const checkVerification = async (address: string) => {
    const brightIdUser = await getBrightIdUserData(address)
    const isVerified = brightIdUser.data?.unique

    if (isVerified) {
      setVerified(isVerified)
      setActiveStep(2)
    } else {
      throw Error("You're not linked with BrightID correctly.")
    }
  }

  const handleClickCheckVerification = async () => {
    try {
      account && (await checkVerification(account))
    } catch (e) {
      setError({
        errorStep: _activeStep,
        message: `${e}`
      })
    }
  }

  return (
    <ThemeProvider theme={theme}>
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
            Link to BrightId
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
                Link BrightID to Interep
              </StepLabel>
              <StepContent style={{ width: 400 }}>
                <Modal open={_open} onClose={handleClose}>
                  <Box className={classes.qrmodal}>
                    {url ? (
                      <QRCode value={url} className={classes.qrcode} />
                    ) : (
                      <Typography>error</Typography>
                    )}
                  </Box>
                </Modal>
                <Button
                  onClick={handleOpen}
                  variant="outlined"
                  disabled={!account}
                >
                  Link BrightID
                </Button>
                <Button
                  onClick={handleClickCheckVerification}
                  variant="outlined"
                  disabled={!account}
                >
                  Check Verification
                </Button>
              </StepContent>
            </Step>
            <Step>
              <StepLabel error={_error?.errorStep === 2}>
                Generate your Semaphore identity
              </StepLabel>
              <StepContent style={{ width: 400 }}>
                <Button
                  fullWidth
                  onClick={generateIdentity}
                  variant="outlined"
                  disabled={verified === false}
                >
                  Generate Identity
                </Button>
              </StepContent>
            </Step>
            <Step>
              <StepLabel error={_error?.errorStep === 3}>
                {hasjoined ? "Leave" : "Join"} Group
              </StepLabel>
              <StepContent style={{ width: 400 }}>
                <LoadingButton
                  fullWidth
                  onClick={hasjoined ? leaveOnchainGroup : joinOnChainGroup}
                  variant="outlined"
                  disabled={!_identityCommitment}
                  loading={_loading}
                >
                  {hasjoined ? "Leave" : "Join"} Group
                </LoadingButton>
              </StepContent>
              {transactionHash && _pending && (
                <Typography variant="body1">
                  Your Transaction is now pending...
                  <br /> Please wait (Check the&nbsp;
                  <Link
                    href={"https://kovan.etherscan.io/tx/" + transactionHash}
                    underline="hover"
                    rel="noreferrer"
                    target="_blank"
                  >
                    transaction
                  </Link>
                  )
                </Typography>
              )}
            </Step>
            <Step>
              <StepContent>
                {transactionHash && _transactionSuccess === true ? (
                  <Typography variant="body1">
                    Transaction success
                    <br /> Check the&nbsp;
                    <Link
                      href={
                        "https://kovan.etherscan.io/tx/" + transactionHash
                      }
                      underline="hover"
                      rel="noreferrer"
                      target="_blank"
                    >
                      transaction
                    </Link>
                  </Typography>
                ) : (
                  <Typography variant="body1">uncaught error</Typography>
                )}
                <Button
                  fullWidth
                  onClick={() => setActiveStep(0)}
                  variant="outlined"
                  disabled={!_ethereumProvider}
                >
                  Home
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
    </ThemeProvider>
  )
}

export default Home
