import { Paper, Typography } from "@mui/material"
import { createStyles, makeStyles } from "@mui/styles"
import { Theme } from "@mui/material/styles"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      position: "relative",
      marginTop: 20,
      width: 530,
      textAlign: "center"
    }
  })
)

export default function ConnectWalletInfo(): JSX.Element {
  const classes = useStyles()

  return (
    <Paper className={classes.container} sx={{ p: 3 }}>
      <Typography variant="subtitle1">You need to connect wallet!</Typography>
    </Paper>
  )
}
