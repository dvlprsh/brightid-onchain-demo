import type { NextPage } from "next"
import { createTheme, ThemeProvider, Theme } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import detectEthereumProvider from "@metamask/detect-provider"
import QRCode from "qrcode.react"
import { Modal, Link } from "@mui/material"
import { Signer, ethers } from "ethers"
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
import useOnChainGroups from "hooks/useOnChainGroups"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      flex: 1
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

interface memberData {
  identityCommitment: string
}
interface subgraphData {
  id: string
  admin: string
  root: string
  memebers: memberData[]
}

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
  const [_hasJoined, setHasJoined] = useState<boolean>()
  const [_identityCommitment, setIdentityCommitment] = useState<string>()
  const [_transactionHash, setTransactionHash] = useState<string>("")

  const {
    groupId,
    signMessage,
    retrieveIdentityCommitment,
    joinGroup,
    leaveGroup,
    transactionHash,
    loading
  } = useOnChainGroups()

  useEffect(() => {
    setError(undefined)

    if (_activeStep === 1 && account) {
      checkVerification(account)
    }
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
    await _ethereumProvider.request({ method: "eth_requestAccounts" })
    await _ethereumProvider.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: "0x2a" //ropsten: "0x3"
        }
      ]
    })
    handleNext()
  }

  async function getBrightIdUserData(address: string) {
    const response = await fetch(
      `https://app.brightid.org/node/v5/verifications/${CONTEXT}/${address}`
    )
    return response.json()
  }

  const checkVerification = useCallback(
    async (address: string) => {
      try {
        const brightIdUser = await getBrightIdUserData(address)
        const isVerified = brightIdUser.data?.unique
        if (isVerified) {
          setVerified(isVerified)
          setActiveStep(2)
        } else {
          throw Error("You're not linked with BrightID correctly.")
        }
      } catch (e) {
        setError({
          errorStep: _activeStep,
          message: `${e}`
        })
      }
    },
    [_activeStep]
  )

  const getSubgraphData = async () => {
    const endPoint =
      "https://api.thegraph.com/subgraphs/name/interep-project/interep-groups-kovan"
      //"https://api.thegraph.com/subgraphs/name/jdhyun09/mysubgraphinterep"
    const query =
      "{onchainGroups(orderBy:id){id,admin,root,members{identityCommitment}}}"
    const response = await fetch(endPoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    })
    return response.json()
  }

  const getGroupData = useCallback(async () => {
    const queryData = await getSubgraphData()
    const groupData = queryData.data.onchainGroups.filter(
      (v: subgraphData) => v.id === groupId
    )
    const admin = groupData[0].admin

    const root = groupData[0].root

    const identityCommitmentsList = groupData[0].members.map(
      (v: memberData) => v.identityCommitment
    )

    return { identityCommitmentsList, admin, root }
  }, [])

  const generateIdentity = async () => {
    try {
      const identityCommitment =
        _signer && (await retrieveIdentityCommitment(_signer))

      if (!identityCommitment) return

      const joinedMembers = (await getGroupData()).identityCommitmentsList
      const hasJoined = joinedMembers.includes(identityCommitment)

      setHasJoined(hasJoined)
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

      const userSignature = await signMessage(_signer, _identityCommitment)

      if (userSignature) {
        if (await joinGroup(_identityCommitment)) {
          setHasJoined(undefined)
          setTransactionHash(transactionHash)
        }
      }
    } catch (e) {
      setError({ errorStep: _activeStep, message: "join group Failed - " + e })
    }
  }

  const leaveOnchainGroup = async () => {
    try {
      if (!_signer || !_identityCommitment) return

      const userSignature = await signMessage(_signer, _identityCommitment)
      const root = (await getGroupData()).root
      const IdentityCommitments = (await getGroupData()).identityCommitmentsList

      if (userSignature) {
        if (await leaveGroup(root, IdentityCommitments, _identityCommitment)) {
          setHasJoined(undefined)
          setTransactionHash(transactionHash)
        }
      }
    } catch (e) {
      setError({ errorStep: _activeStep, message: "leave group Failed - " + e })
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
                  fullWidth={false}
                  onClick={handleOpen}
                  variant="outlined"
                  disabled={!account}
                >
                  Link BrightID
                </Button>
                <Button
                  fullWidth={false}
                  onClick={() => {
                    account && checkVerification(account)
                  }}
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
                  fullWidth={false}
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
                {_hasJoined ? "Leave" : "Join"} Group
              </StepLabel>
              <StepContent style={{ width: 400 }}>
                <Button
                  fullWidth={false}
                  onClick={_hasJoined ? leaveOnchainGroup : joinOnChainGroup}
                  variant="outlined"
                  disabled={!_identityCommitment}
                >
                  {_hasJoined ? "Leave" : "Join"} Group
                </Button>
              </StepContent>
              {_transactionHash && (
                <Typography variant="body1">
                  Your onchain group {_hasJoined ? "leave" : "join"}
                  transaction sent successfully.
                  <br /> Check the&nbsp;
                  <Link
                    href={"https://kovan.etherscan.io/tx/" + _transactionHash}
                    underline="hover"
                    rel="noreferrer"
                    target="_blank"
                  >
                    transaction
                  </Link>
                  !
                </Typography>
              )}
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
