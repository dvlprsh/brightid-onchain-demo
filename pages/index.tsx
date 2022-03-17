import type { NextPage } from "next"
import { createTheme, ThemeProvider, Theme } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import { LoadingButton } from "@mui/lab"
import detectEthereumProvider from "@metamask/detect-provider"
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
import { useEffect, useState } from "react"

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
    results: {
      position: "relative",
      marginTop: 20,
      width: 530,
      textAlign: "center"
    },
    resetButton: {
      zIndex: 1,
      right: 5,
      top: 5
    },
    listItem: {
      paddingTop: 0,
      paddingBottom: 0
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
  const [_ethereumProvider, setEthereumProvider] = useState<any>()
  const [_activeStep, setActiveStep] = useState<number>(0)
  const [_error, setError] = useState<boolean>(false)
  const [_loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    ;(async function IIFE() {
        if (!_ethereumProvider) {
            const ethereumProvider = (await detectEthereumProvider()) as any

            if (ethereumProvider) {
                setEthereumProvider(ethereumProvider)
            } else {
                console.error("Please install Metamask!")
            }
        } else {
            const accounts = await _ethereumProvider.request({ method: "eth_accounts" })

            if (accounts.length !== 0 && accounts[0]) {
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
          chainId: "0x2a"
        }
      ]
    })
    handleNext()
  }

  function handleNext() {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
    setError(false)
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
              <StepLabel>Connect your wallet with Metamask</StepLabel>
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
              <StepLabel error={!!_error}>Link BrightId to Interep</StepLabel>
              <StepContent style={{ width: 400 }}>
                <LoadingButton
                  loading={_loading}
                  loadingIndicator="Loading..."
                  fullWidth
                  variant="outlined"
                >
                  Linking
                </LoadingButton>
              </StepContent>
            </Step>
          </Stepper>
        </Box>
      </Paper>
    </ThemeProvider>
  )
}

export default Home
