import { useCallback, useState } from "react"
import { Contract, providers, Wallet } from "ethers"
import Interep from "contract-artifacts/Interep.json"
import BrightidInterep from "contract-artifacts/BrightidInterep.json"
import getNextConfig from "next/config"
import stringify from "fast-json-stable-stringify"
import { sponsor } from "brightid_sdk"
import { VerificationsApiResponse } from "src/types"

const provider = new providers.JsonRpcProvider(
  `https://kovan.infura.io/v3/${
    getNextConfig().publicRuntimeConfig.infuraApiKey
  }` // kovan
)
const contract = new Contract(
  "0x5B8e7cC7bAC61A4b952d472b67056B2f260ba6dc", // kovan
  Interep.abi,
  provider
)

const BrightidInterepContract = new Contract(
  "0xc031D67F28FD31163aB91283bb4a3A977a26FBc0",
  BrightidInterep.abi,
  provider
)

//const GROUP_NAME = "brightidv1"
const GROUPID = "627269676874696476310" //formatUint248String("brightidv1")
const SIGNAL = "hello"
const ADMIN = getNextConfig().publicRuntimeConfig.adminprivatekey
const adminWallet = ADMIN && new Wallet(ADMIN, provider)
const CONTEXT = "interep"
const privateKey = getNextConfig().publicRuntimeConfig.brightIdApiKey || ""

type ReturnParameters = {
  getBrightIdUserData: (address: string) => Promise<any>
  selfSponsor: (address: string) => Promise<any>
  registerBrightId: (address: string) => Promise<any>
  etherscanLink: string
  transactionstatus: boolean
  loading: boolean
}

const getMessage = (op: any) => {
  const signedOp: any = {}
  for (let k in op) {
    if (["sig", "sig1", "sig2", "hash"].includes(k)) {
      continue
    }
    signedOp[k] = op[k]
  }
  return stringify(signedOp)
}

export default function useBrightId(): ReturnParameters {
  const [_loading, setLoading] = useState<boolean>(false)
  const [_link, setEtherscanLink] = useState<string>("")
  const [_transactionStatus, setTransactionStatus] = useState<boolean>(false)

  const getBrightIdUserData = useCallback(
    async (address: string): Promise<VerificationsApiResponse | null> => {
      try {
        const response = await fetch(
          `https://app.brightid.org/node/v5/verifications/${CONTEXT}/${address}?signed=eth&timestamp=seconds`
        )
        return response.json()
      } catch (error) {
        console.error(error)
        setLoading(false)
        return null
      }
    },
    []
  )

  const registerBrightId = useCallback(async (address: string) => {
    try {
      setLoading(true)

      const response = await getBrightIdUserData(address)

      if (!response?.data) throw new Error()

      const {
        contextIds,
        sig: { r, s, v },
        timestamp
      } = response?.data

      const transaction = await BrightidInterepContract.connect(
        adminWallet
      ).register(CONTEXT, contextIds, timestamp, v, r, s)

      const receipt = await provider.waitForTransaction(transaction.hash)

      setTransactionStatus(!!receipt.status)
      setEtherscanLink("https://kovan.etherscan.io/tx/" + transaction.hash)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }, [])

  const selfSponsor = useCallback(async (address: string) => {
    try {
      const response = await sponsor(privateKey, CONTEXT, address)

      return response
    } catch (error) {
      setLoading(false)
      return null
    }
  }, [])
  return {
    getBrightIdUserData,
    selfSponsor,
    registerBrightId,
    etherscanLink: _link,
    transactionstatus: _transactionStatus,
    loading: _loading
  }
}
