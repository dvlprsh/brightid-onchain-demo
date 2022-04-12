import { useCallback, useState } from "react"
import { Contract, providers, Signer } from "ethers"
import { formatBytes32String } from "ethers/lib/utils"
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

const BrightidInterepContract = new Contract(
  "0xc031D67F28FD31163aB91283bb4a3A977a26FBc0",
  BrightidInterep.abi,
  provider
)

const CONTEXT = "interep"
const privateKey = getNextConfig().publicRuntimeConfig.brightIdApiKey || ""

type ReturnParameters = {
  getBrightIdUserData: (address: string) => Promise<any>
  selfSponsor: (address: string) => Promise<any>
  registerBrightId: (signer: Signer) => Promise<any>
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

  const registerBrightId = useCallback(async (signer: Signer) => {
    try {
      setLoading(true)

      const response = await getBrightIdUserData(await signer.getAddress())

      if (!response?.data) throw new Error()

      const {
        contextIds,
        sig: { r, s, v },
        timestamp
      } = response?.data

      const transaction = await BrightidInterepContract.connect(signer)
      .register(formatBytes32String(CONTEXT), contextIds, timestamp, v, "0x"+r, "0x"+s)

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
