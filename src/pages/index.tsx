import type { NextPage } from "next"
import { createTheme, ThemeProvider, Theme } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import detectEthereumProvider from "@metamask/detect-provider"
import QRCode from "qrcode.react"
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
import useBrightId from "src/hooks/useBrightId"

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
    },
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

const Home: NextPage = () => {
  const classes = useStyles()

  const [_ethereumProvider, setEthereumProvider] = useState<any>()
  const [_activeStep, setActiveStep] = useState<number>(0)
  const [_error, setError] = useState<
    { errorStep: number; message?: string } | undefined
  >()
  const [_loading, setLoading] = useState<boolean>(false)
  const [url, setUrl] = useState<string>()
  const [account, setAccount] = useState<string>()
  const [verified, setVerified] = useState<boolean>(false)
  const [_signer, setSigner] = useState<Signer>()
  const [_identityCommitment, setIdentityCommitment] = useState<string>()
  const [_transactionstatus, setTransactionstatus] = useState<boolean>()
  const [_etherscanLink, setEtherscanLink] = useState<string>()

  const {
    signMessage,
    retrieveIdentityCommitment,
    joinGroup,
    leaveGroup,
    hasjoined,
    loading,
    etherscanLink,
    transactionstatus
  } = useOnChainGroups()

  const {
    getBrightIdUserData,
    selfSponsor,
    registerBrightId,
    checkBrightid,
    transactionstatus: brightIdTransactionstatus,
    loading: brightIdLoading,
    etherscanLink: brightIdEtherscanLink
  } = useBrightId()

  useEffect(() => {
    if (brightIdTransactionstatus !== undefined) {
      setTransactionstatus(brightIdTransactionstatus)
    }
  }, [brightIdTransactionstatus])

  useEffect(() => {
    if (transactionstatus !== undefined) {
      setTransactionstatus(transactionstatus)
    }
  }, [transactionstatus])

  useEffect(() => {
    etherscanLink && setEtherscanLink(etherscanLink)
  }, [etherscanLink])

  useEffect(() => {
    brightIdEtherscanLink && setEtherscanLink(brightIdEtherscanLink)
  }, [brightIdEtherscanLink])

  useEffect(() => {
    ;(async () => {
      setError(undefined)

      if (_activeStep === 1 && account) {
        await checkVerification(account)
      }
    })()
  }, [_activeStep, account])

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

        _ethereumProvider.on("accountsChanged", (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
            setActiveStep(0)
          }
        })
      }
    })()
  }, [_ethereumProvider])

  async function connect() {
    const accounts = await _ethereumProvider.request({
      method: "eth_requestAccounts"
    })
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

  const checkVerification = async (address: string) => {
    const isRegistered = await checkBrightid(address)

    if (isRegistered) {
      setActiveStep(2)
      setVerified(true)
    }
  }

  const registerBrightIdOnChain = async () => {
    try {
      if (!_signer || !account) return

      const isSuccess = await registerBrightId(_signer)

      if (isSuccess) {
        setActiveStep(2)
        setVerified(true)
      }
    } catch (e) {
      setError({
        errorStep: _activeStep,
        message: `${e}`
      })
    }
  }

  const refreshPage = () => {
    window.location.reload()
  }
  
  return (
    <ThemeProvider theme={theme}>
      <Paper className={classes.container} elevation={0} square={true}>
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
                <Paper className={classes.stepWrapper} sx={{ p: 3 }}>
                  <Typography variant="h5">Link BrightID</Typography>
                  {url ? (
                    <QRCode value={url} className={classes.qrcode} />
                  ) : (
                    <Typography>error</Typography>
                  )}
                  <LoadingButton
                    onClick={registerBrightIdOnChain}
                    variant="outlined"
                    disabled={!account}
                    loading={brightIdLoading}
                  >
                    Register BrightID On-Chain
                  </LoadingButton>
                </Paper>
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
                {_transactionstatus ? (
                  <Box>
                    <Typography variant="body1">
                      Transaction{" "}
                      {!!_transactionstatus ? "Successful" : "Failed"} (Check
                      the&nbsp;
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
                    onClick={hasjoined ? leaveOnchainGroup : joinOnChainGroup}
                    variant="outlined"
                    loading={loading}
                  >
                    {hasjoined ? "Leave" : "Join"} Group
                  </LoadingButton>
                )}
              </StepContent>
            </Step>
          </Stepper>
          <Paper className={classes.results} sx={{ p: 3 }}>
            {account && (
              <>
                <Typography variant="subtitle1">Selected account</Typography>
                <Typography variant="body1">{account}</Typography>
              </>
            )}
          </Paper>
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
