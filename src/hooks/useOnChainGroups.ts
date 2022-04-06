import { useCallback, useState } from "react"
import { Signer, Contract, providers, Wallet, utils } from "ethers"
import { OnchainAPI } from "@interep/api"
import createIdentity from "@interep/identity"
import Interep from "contract-artifacts/Interep.json"
import getNextConfig from "next/config"
import { generateMerkleProof } from "src/generatemerkleproof"
import { HashZero } from "@ethersproject/constants"
import { toUtf8Bytes, concat, hexlify } from "ethers/lib/utils"
import { Bytes31 } from "soltypes"
import * as qs from "qs"

const contract = new Contract(
    "0x5B8e7cC7bAC61A4b952d472b67056B2f260ba6dc", // kovan
  Interep.abi
)
const provider = new providers.JsonRpcProvider(
  `https://kovan.infura.io/v3/${getNextConfig().publicRuntimeConfig.infuraApiKey}` // kovan
)

//const GROUP_NAME = "brightidv1"
const SIGNAL = "hello"
const ADMIN = getNextConfig().publicRuntimeConfig.adminprivatekey
const adminWallet = ADMIN && new Wallet(ADMIN, provider)

function formatUint248String(text: string): string {
  const bytes = toUtf8Bytes(text);
  
  if(bytes.length > 30) { throw new Error("byte31 string must be less than 31 bytes")}
  
  const hash = new Bytes31(hexlify(concat([bytes, HashZero]).slice(0, 31)))
  return hash.toUint().toString()
}

type ReturnParameters = {
  groupId: string
  signMessage: (signer: Signer, message: string) => Promise<string | null>
  retrieveIdentityCommitment: (signer: Signer) => Promise<string | null>
  joinGroup: (identityCommitment: string) => Promise<true | null>
  leaveGroup: (
    identityCommitment: string
  ) => Promise<true | null>
  proveMembership: (signer: Signer) => Promise<boolean | undefined>
  transactionHash: string
  hasjoined: boolean
  loading: boolean
}

export default function useOnChainGroups(): ReturnParameters {
  const groupId = "627269676874696476310"//formatUint248String("brightidv1") //173940653116352066111980355808565635588994233647684490854317820238565998592
  const [_loading, setLoading] = useState<boolean>(false)
  const [_transactionHash, setTransactionHash] = useState<string>("")
  const [_hasjoined, setHasjoined] = useState<boolean>(false)

  const signMessage = useCallback(
    async (signer: Signer, message: string): Promise<string | null> => {
      try {
        setLoading(true)

        const signedMessage = await signer.signMessage(message)

        setLoading(false)
        return signedMessage
      } catch (error) {
        console.error(error)
        setLoading(false)
        return null
      }
    },
    []
  )

  const retrieveIdentityCommitment = useCallback(
    async (signer: Signer): Promise<string | null> => {
      setLoading(true)

      const identity = await createIdentity(
        (message) => signer.signMessage(message),
        groupId
      )

      const identityCommitment = identity.genIdentityCommitment()

      const api = new OnchainAPI()
      const members = await api.getGroupMembers({ groupId:groupId })
      const identityCommitments = members.map((member:any) => member.identityCommitment)

      const hasJoined = identityCommitments.includes(identityCommitment.toString())
      setHasjoined(hasJoined)
      
      setLoading(false)
      return identityCommitment.toString()
    },
    []
  )

  const joinGroup = useCallback(
    async (identityCommitment: string): Promise<true | null> => {
      if (!adminWallet) return null

      setLoading(true)

      const transaction = await contract
        .connect(adminWallet)
        .addMember(groupId, identityCommitment,{gasPrice: utils.parseUnits("10","gwei"), gasLimit: 3000000})

      setTransactionHash(transaction.hash)
      setLoading(false)
      return true
    },
    []
  )

  const leaveGroup = useCallback(
    async (
      IdentityCommitment: string
    ): Promise<true | null> => {
      if (!adminWallet) return null

      setLoading(true)

      const api = new OnchainAPI()
      const { root } = await api.getGroup({ id:groupId })
      const members = await api.getGroupMembers({ groupId:groupId })
      // order by index
      const identityCommitments = members.map((member:any) => member.identityCommitment)

      const merkleproof = generateMerkleProof(
        20,
        BigInt(0),
        identityCommitments,
        IdentityCommitment
      )

      if (merkleproof.root != root)
        throw "root different. your transaction must be failed"

      const transaction = await contract
        .connect(adminWallet)
        .removeMember(
          groupId,
          IdentityCommitment,
          merkleproof.siblings,
          merkleproof.pathIndices,
          {gasPrice: utils.parseUnits("10","gwei"), gasLimit: 3000000}
        )

      setTransactionHash(transaction.hash)
      setLoading(false)

      return true
    },
    []
  )

  const proveMembership = useCallback(
    async (signer: Signer): Promise<boolean | undefined> => {
      const message = await signer.signMessage(
        "Sign this message to generate your brightId Semaphore identity with key nonce: 0."
      )

      setLoading(true)

      try {
        const response = await fetch(
          `/api/proof${qs.stringify(
            {
              message,
              groupId,
              signal: SIGNAL
            },
            { addQueryPrefix: true }
          )}`,
          {
            method: "GET"
          }
        ).then((response) => response.json())

        if (response.error) {
          throw new Error(response.error)
        }

        return !!response.isVerified
      } catch (error) {
        setLoading(false)
        throw error
      }
    },
    []
  )

  return {
    groupId,
    retrieveIdentityCommitment,
    signMessage,
    joinGroup,
    leaveGroup,
    proveMembership,
    transactionHash: _transactionHash,
    hasjoined: _hasjoined,
    loading: _loading
  }
}
