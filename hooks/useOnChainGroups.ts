import { useCallback, useState } from "react"
import { Signer, utils, Contract, providers, Wallet } from "ethers"
import createIdentity from "@interep/identity"
import Interep from "contract-artifacts/Interep.json"
import getNextConfig from "next/config"
import { generateMerkleProof } from "src/generatemerkleproof"

const contract = new Contract(
  "0x5B8e7cC7bAC61A4b952d472b67056B2f260ba6dc", //ropsten: 0xC36B2b846c53a351d2Eb5Ac77848A3dCc12ef22A
  Interep.abi
)
const provider = new providers.JsonRpcProvider(
  `https://kovan.infura.io/v3/${getNextConfig().publicRuntimeConfig.infuraApiKey}`
)

// const ADMIN = getNextConfig().publicRuntimeConfig.adminMnemonic
// const adminWallet = Wallet.fromMnemonic(ADMIN).connect(provider)
// // Mnemonic

const ADMIN = getNextConfig().publicRuntimeConfig.adminprivatekey
const adminWallet = ADMIN && new Wallet(ADMIN, provider)
// Privatekey
//const adminAddress = adminWallet.getAddress()

type ReturnParameters = {
  groupId: string
  signMessage: (signer: Signer, message: string) => Promise<string | null>
  retrieveIdentityCommitment: (signer: Signer) => Promise<string | null>
  joinGroup: (identityCommitment: string) => Promise<true | null>
  leaveGroup: (
    root: string,
    members: string[],
    identityCommitment: string
  ) => Promise<true | null>
  transactionHash: string
  loading: boolean
}

export default function useOnChainGroups(): ReturnParameters {
  const groupId = "627269676874696476310"
  // utils.formatBytes32String("brightid") : 0x6272696768746964763100000000000000000000000000000000000000000000
  const [_loading, setLoading] = useState<boolean>(false)
  const [_transactionHash, setTransactionHash] = useState<string>("")

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
        .addMember(groupId, identityCommitment)

      setTransactionHash(transaction.hash)
      setLoading(false)
      return true
    },
    []
  )

  const leaveGroup = useCallback(
    async (
      root: string,
      members: string[],
      IdentityCommitment: string
    ): Promise<true | null> => {
      if (!adminWallet) return null

      setLoading(true)

      const merkleproof = generateMerkleProof(
        20,
        BigInt(0),
        members,
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
          merkleproof.pathIndices
        )

      setTransactionHash(transaction.hash)
      setLoading(false)

      return true
    },
    []
  )

  return {
    groupId,
    retrieveIdentityCommitment,
    signMessage,
    joinGroup,
    leaveGroup,
    transactionHash: _transactionHash,
    loading: _loading
  }
}
