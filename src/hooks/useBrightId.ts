import { useCallback, useState } from "react"
import { Signer, Contract, providers, Wallet, utils } from "ethers"
import { OnchainAPI } from "@interep/api"
import createIdentity from "@interep/identity"
import Interep from "contract-artifacts/Interep.json"
import BrightidInterep from "contract-artifacts/BrightidInterep.json"
import getNextConfig from "next/config"
import stringify from "fast-json-stable-stringify"
import B64 from "base64-js"
import tweetNacl from "tweetnacl"
import tweetNaclUtils from "tweetnacl-util"
import { sponsor } from "brightid_sdk"
import { getAddress } from "ethers/lib/utils"

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
  transactionHash: string
  hasjoined: boolean
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
  const [_transactionHash, setTransactionHash] = useState<string>("")
  const [_hasjoined, setHasjoined] = useState<boolean>(false)

  const getBrightIdUserData = useCallback(
    async (address: string): Promise<string | null> => {
      try {
        const response = await fetch(
          `https://app.brightid.org/node/v5/verifications/${CONTEXT}/${address}`
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

  //Todo: find component of signiture _v, _r, _s
  const registerBrightId = useCallback(async (address: string) => {
    const transaction = await BrightidInterepContract.connect(
      adminWallet
    ).register(CONTEXT, address, Date.now(), "_v", "_r", "_s")
  }, [])

  const selfSponsor = useCallback(async (address: string) => {
    try {
      const op = {
        name: "Sponsor",
        app: CONTEXT,
        contextId: address,
        timestamp: Date.now(),
        v: 5,
        sig: ""
      }

      // const message = getMessage(op)
      // const messageUint8Array = Buffer.from(message)
      // console.log("test", message, messageUint8Array)
      // const privateKeyUint8Array = tweetNaclUtils.decodeBase64(privateKey)

      // const signedMessageUint8Array = tweetNacl.sign.detached(
      //   messageUint8Array,
      //   privateKeyUint8Array
      // )

      // op.sig = tweetNaclUtils.encodeBase64(signedMessageUint8Array)

      const message = getMessage(op)
      const arrayedMessage = Buffer.from(message)
      const keyBuffer = B64.toByteArray(privateKey)
      let signature = tweetNacl.sign.detached(arrayedMessage, keyBuffer)
      op.sig = B64.fromByteArray(signature)

      // const response = await fetch(
      //   "https://app.brightid.org/node/v5/operations",
      //   {
      //     method: "POST",
      //     headers: {
      //       Accept: "application/json",
      //       "Content-Type": "application/json"
      //     },
      //     body: JSON.stringify(op)
      //   }
      // )

      const response = await sponsor(privateKey, CONTEXT, address)
      console.log("sponsor response", response)
      return response
    } catch (error) {
      console.error(error)
      setLoading(false)
      return null
    }
  }, [])
  return {
    getBrightIdUserData,
    selfSponsor,
    registerBrightId,
    transactionHash: _transactionHash,
    hasjoined: _hasjoined,
    loading: _loading
  }
}
