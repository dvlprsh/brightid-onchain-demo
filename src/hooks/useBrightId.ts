import { useCallback, useState } from "react"
import { Contract, providers, Signer, utils } from "ethers"
import { formatBytes32String } from "ethers/lib/utils"
import BrightidOnchain from "contract-artifacts/BrightidOnchainGroup.json"
import getNextConfig from "next/config"
import { sponsor } from "brightid_sdk"
import { VerificationsApiResponse } from "src/types"

const provider = new providers.JsonRpcProvider(
  `https://kovan.infura.io/v3/${
    getNextConfig().publicRuntimeConfig.infuraApiKey
  }` // kovan
)

const BrightidOnchainContract = new Contract(
  "0xb2EE3750E8Ca888B9AbA20501d5b33534f847ca7",
  BrightidOnchain.abi,
  provider
)

const CONTEXT = "interep"
const privateKey = getNextConfig().publicRuntimeConfig.brightIdApiKey || ""

type ReturnParameters = {
  getBrightIdUserData: (address: string) => Promise<any>
  selfSponsor: (address: string) => Promise<any>
  registerBrightId: (signer: Signer) => Promise<boolean>
  checkBrightid: (address: string) => Promise<any>
  etherscanLink?: string
  transactionstatus?: boolean
  loading: boolean
}

export default function useBrightId(): ReturnParameters {
  const [_loading, setLoading] = useState<boolean>(false)
  const [_link, setEtherscanLink] = useState<string>()
  const [_transactionStatus, setTransactionStatus] = useState<boolean>()

  const getBrightIdUserData = useCallback(
    async (address: string): Promise<VerificationsApiResponse | null> => {
      try {
        const response = await fetch(
          `https://app.brightid.org/node/v5/verifications/${CONTEXT}/${address}?signed=eth&timestamp=seconds`
        )
        return response.json()
      } catch (error) {
        setLoading(false)
        return null
      }
    },
    []
  )

  const checkBrightid = useCallback(
    async (address: string): Promise<boolean | null> => {
      try {
        const isRegistered = await BrightidOnchainContract.isVerifiedUser(
          address
        )

        return isRegistered
      } catch (error) {
        setLoading(false)
        return null
      }
    },
    []
  )

  const registerBrightId = useCallback(async (signer: Signer): Promise<boolean> => {
    try {
      setLoading(true)

      const brightIdUser = await getBrightIdUserData(await signer.getAddress())

      if (!brightIdUser?.data) throw new Error()

      const {
        contextIds,
        sig: { r, s, v },
        timestamp,
        unique: isVerified
      } = brightIdUser.data

      if(!isVerified)  throw Error("You're not linked with BrightID correctly.")

      const transaction = await BrightidOnchainContract.connect(
        signer
      ).register(
        formatBytes32String(CONTEXT),
        contextIds,
        timestamp,
        v,
        "0x" + r,
        "0x" + s,
        { gasPrice: utils.parseUnits("10", "gwei"), gasLimit: 3000000 }
      )

      const receipt = await provider.waitForTransaction(transaction.hash)
      const isSuccess = !!receipt.status

      setTransactionStatus(isSuccess)
      setEtherscanLink("https://kovan.etherscan.io/tx/" + transaction.hash)
      setLoading(false)

      return isSuccess
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
    checkBrightid,
    etherscanLink: _link,
    transactionstatus: _transactionStatus,
    loading: _loading
  }
}
