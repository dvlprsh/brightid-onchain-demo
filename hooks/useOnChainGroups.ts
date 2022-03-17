import { useCallback, useState } from "react"
import { Signer, utils, Contract, providers, Wallet } from "ethers"
import createIdentity from "@interep/identity"
import Interep from "contract-artifacts/Interep.json"
import getNextConfig from "next/config"
import { generateMerkleProof } from "src/generatemerkleproof"

const contract = new Contract(
  "0xC36B2b846c53a351d2Eb5Ac77848A3dCc12ef22A", //0xC36B2b846c53a351d2Eb5Ac77848A3dCc12ef22A
  Interep.abi
)
const provider = new providers.JsonRpcProvider(
  `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`
)

// const ADMIN = getNextConfig().publicRuntimeConfig.adminMnemonic
// const adminWallet = Wallet.fromMnemonic(ADMIN).connect(provider)
// // Mnemonic

const ADMIN = getNextConfig().publicRuntimeConfig.adminprivatekey
const adminWallet = new Wallet(ADMIN, provider)
// Privatekey

// const adminAddress = adminWallet.getAddress()
const groupId = "333" // utils.formatBytes32String("brightid")


type ReturnParameters = {
  signMessage: (signer: Signer, message: string) => Promise<string | null>
  retrieveIdentityCommitment: (signer: Signer) => Promise<string | null>
  joinGroup: (identityCommitment: string) => Promise<true | null>
  leaveGroup: (
    identityCommitment: bigint,
    members: bigint[]
  ) => Promise<true | null>
  loading: boolean
}

export default function useOnChainGroups(): ReturnParameters {
  const [_loading, setLoading] = useState<boolean>(false)

  const signMessage = useCallback(
    async (signer: Signer, message: string): Promise<string | null> => {
      try {
        setLoading(true)

        const signedMessage = await signer.signMessage(message)

        setLoading(false)
        return signedMessage
      } catch (error) {
        console.error(error)

        // toast({
        //     description: "Your signature is needed to join/leave the group.",
        //     variant: "subtle",
        //     isClosable: true
        // })

        setLoading(false)
        return null
      }
    },
    []
  )

  const retrieveIdentityCommitment = useCallback(
    async (signer: Signer): Promise<string | null> => {
      try {
        setLoading(true)

        const identity = await createIdentity(
          (message) => signer.signMessage(message),
          groupId
        )
        const identityCommitment = identity.genIdentityCommitment()
        setLoading(false)
        return identityCommitment.toString()
      } catch (error) {
        console.error(error)

        // toast({
        //     description: "Your signature is needed to create the identity commitment.",
        //     variant: "subtle",
        //     isClosable: true
        // })

        setLoading(false)
        return null
      }
    },
    []
  )

  const joinGroup = useCallback(
    async (identityCommitment: string): Promise<true | null> => {
      setLoading(true)

      await contract
        .connect(adminWallet)
        .addMember(groupId, identityCommitment, { gasLimit: 3000000 })

      setLoading(false)
      // toast({
      //   description: `You joined the ${groupId} group correctly.`,
      //   variant: "subtle",
      //   isClosable: true
      // })
      return true
    },
    []
  )

  const leaveGroup = useCallback(
    async (
      IdentityCommitment: bigint,
      members: bigint[]
    ): Promise<true | null> => {
      setLoading(true)
      const merkleproof = generateMerkleProof(20,BigInt(0),members,IdentityCommitment)
      console.log(
          "\n---leaf----\n" +
          merkleproof.leaf +
          "\n----pathindices---\n" +
          merkleproof.pathIndices +
          "\n---root----\n" +
          merkleproof.root +
          "\n----siblings---\n" +
          merkleproof.siblings
      )
      await contract
        .connect(adminWallet)
        .removeMember(
          groupId,
          IdentityCommitment,
          merkleproof.siblings,
          merkleproof.pathIndices,
          { gasLimit: 3000000 }
        )

      setLoading(false)
          // toast({
          //   description: `You out`,
          //   variant: "subtle",
          //   isClosable: true
          // })
      return true
    },
    []
  )

  return {
    retrieveIdentityCommitment,
    signMessage,
    joinGroup,
    leaveGroup,
    loading: _loading
  }
}
