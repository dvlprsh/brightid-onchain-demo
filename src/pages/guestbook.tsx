import type { NextPage } from "next"
import { Theme } from "@mui/material/styles"
import { createStyles, makeStyles } from "@mui/styles"
import { Link, TextField } from "@mui/material"
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
import React, { useState } from "react"
import useOnChainGroups from "src/hooks/useOnChainGroups"
import MousIcon from "@mui/icons-material/Mouse"
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

const Proof: NextPage = () => {
  const classes = useStyles()

  const _signer = useSigner()
  const [_activeStep, setActiveStep] = useState<number>(0)
  const [_error, setError] = useState<
    { errorStep: number; message?: string } | undefined
  >()
  const [guestSignal, setGuestSignal] = useState<string>("")
  const [guestBook, setGuestBook] = useState<string[]>([])
  const [openGuestBook, setOpenGuestBook] = useState<boolean>(false)

  const {
    proveMembership,
    loadGuestBook,
    loading,
    etherscanLink,
    transactionstatus
  } = useOnChainGroups()

  function handleNext() {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
    setError(undefined)
  }

  const getMembershipProof = async () => {
    try {
      const hasMembership =
        _signer && (await proveMembership(_signer, guestSignal))
    } catch (e) {
      setError({
        errorStep: _activeStep,
        message: "membership proof Failed - " + e
      })
    }
  }

  const getSignal = (e: any) => {
    e.preventDefault()
    handleNext()
  }

  const printGuestBook = async () => {
    try {
      const signalList = await loadGuestBook()
      if (signalList) {
        setGuestBook(signalList)
      }
      setOpenGuestBook(true)
    } catch (e) {
      setError({
        errorStep: _activeStep,
        message: "Can't load the guestBook - " + e
      })
    }
  }

  return (
    <Paper className={classes.container} elevation={0} square={true}>
      <Box className={classes.content}>
        <Button
          onClick={printGuestBook}
          sx={{ color: "white" }}
          endIcon={<MousIcon />}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            Guest Book
          </Typography>
        </Button>

        <Typography variant="body1" sx={{ mb: 4 }}>
          You can leave message in the Guestbook by prooving membership(only
          once)
        </Typography>

        <Stepper activeStep={_activeStep} orientation="vertical">
          <Step>
            <StepLabel error={_error?.errorStep === 1}>Guestbook</StepLabel>
            <StepContent style={{ width: 400 }}>
              <form onSubmit={getSignal} style={{ width: 400 }}>
                <TextField
                  required
                  id="guest-book"
                  label="leave guestbook"
                  variant="filled"
                  inputProps={{ maxLength: 30 }}
                  onInput={(e: any) => {
                    setGuestSignal(e.target.value)
                  }}
                  style={{ width: 300, height: 50 }}
                />
                <Button
                  type="submit"
                  variant="outlined"
                  style={{ width: 100, height: 55 }}
                >
                  Submit
                </Button>
              </form>
            </StepContent>
          </Step>
          <Step>
            <StepLabel error={_error?.errorStep === 2}>
              Proof Membership
            </StepLabel>
            <StepContent style={{ width: 400 }}>
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
                  <Button fullWidth variant="outlined" onClick={printGuestBook}>
                    Print Guest Book
                  </Button>
                </Box>
              ) : (
                <LoadingButton
                  fullWidth
                  onClick={getMembershipProof}
                  variant="outlined"
                  loading={loading}
                >
                  Proof Membership
                </LoadingButton>
              )}
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
        {openGuestBook && (
          <Paper className={classes.results} sx={{ p: 3 }}>
            {guestBook.map((guest, index) => (
              <Typography variant="body1" key={index} sx={{ borderBottom: 1 }}>
                {guest}
              </Typography>
            ))}
          </Paper>
        )}
      </Box>
    </Paper>
  )
}

export default Proof
