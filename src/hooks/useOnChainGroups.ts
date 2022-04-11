import { useCallback, useState } from "react"
import { Signer, Contract, providers, Wallet, utils } from "ethers"
import { OnchainAPI } from "@interep/api"
import createIdentity from "@interep/identity"
import Interep from "contract-artifacts/Interep.json"
import BrightidInterep from "contract-artifacts/BrightidInterep.json"
import getNextConfig from "next/config"
import { generateMerkleProof } from "src/generatemerkleproof"
import { HashZero } from "@ethersproject/constants"
import { toUtf8Bytes, concat, hexlify } from "ethers/lib/utils"
import { Bytes31 } from "soltypes"
import * as qs from "qs"

function formatUint248String(text: string): string {
  const bytes = toUtf8Bytes(text);
  
  if(bytes.length > 30) { throw new Error("byte31 string must be less than 31 bytes")}
  
  const hash = new Bytes31(hexlify(concat([bytes, HashZero]).slice(0, 31)))
  return hash.toUint().toString()
}

const provider = new providers.JsonRpcProvider(
  `https://kovan.infura.io/v3/${getNextConfig().publicRuntimeConfig.infuraApiKey}` // kovan
)
const InterepContract = new Contract("0x5B8e7cC7bAC61A4b952d472b67056B2f260ba6dc", Interep.abi, provider)
const BrightidInterepContract = new Contract("0xc031D67F28FD31163aB91283bb4a3A977a26FBc0", BrightidInterep.abi, provider)

//const GROUP_NAME = "brightidv1"
const GROUPID = "3535"//"627269676874696476310"//formatUint248String("brightidv1")
const SIGNAL = "hello"
const ADMIN = getNextConfig().publicRuntimeConfig.adminprivatekey
const adminWallet = ADMIN && new Wallet(ADMIN, provider)

type ReturnParameters = {
  signMessage: (signer: Signer, message: string) => Promise<string | null>
  retrieveIdentityCommitment: (signer: Signer) => Promise<string | null>
  joinGroup: (identityCommitment: string) => Promise<true | null>
  leaveGroup: (
    identityCommitment: string
  ) => Promise<true | null>
  proveMembership: (signer: Signer) => Promise<boolean | undefined>
  etherscanLink: string
  transactionstatus: boolean
  hasjoined: boolean
  loading: boolean
}

export default function useOnChainGroups(): ReturnParameters {
  const [_loading, setLoading] = useState<boolean>(false)
  const [_link, setEtherscanLink] = useState<string>("")
  const [_transactionStatus, setTransactionStatus] = useState<boolean>(false)
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
        GROUPID
      )

      /***************test***************** */
      
      const startblock = 30391824  //30946902 BrightidInterep created

      //const filter = BrightidInterepContract.filters.saveMessage(externalNullifier)
      const filter = InterepContract.filters.MemberAdded(utils.hexlify(BigInt(GROUPID)))
      const hi = await InterepContract.queryFilter(filter, startblock)

      //first way
      let myArray1 = []
      console.log(hi)
      for(let i = 0; i < hi.length; i++){
        myArray1.push(hi[i].args?.[1])
      }
      console.log(myArray1)

      //second way
      let myArray2 = []
      for(let i = 0; i< hi.length; i++){
        myArray2.push(hi[i].data)
      }
      console.log(myArray2)

      /***************************** */

      const identityCommitment = identity.genIdentityCommitment()

      const api = new OnchainAPI()
      const members = await api.getGroupMembers({ groupId:GROUPID })

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

      const transaction = await InterepContract
        .connect(adminWallet)
        .addMember(GROUPID, identityCommitment,{gasPrice: utils.parseUnits("10","gwei"), gasLimit: 3000000})

      const receipt = await provider.waitForTransaction(transaction.hash)
      console.log(receipt.status)

      if(receipt.status) {setTransactionStatus(true)}
      else {setTransactionStatus(false)}

      setEtherscanLink("https://kovan.etherscan.io/tx/"+transaction.hash)
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
      const { root } = await api.getGroup({ id:GROUPID })
      const members = await api.getGroupMembers({ groupId:GROUPID })
      
      const indexedMembers = members.map((member:any) => [member.index, member.identityCommitment]).sort()
      const identityCommitments = indexedMembers.map((member:any) => member[1])

      const merkleproof = generateMerkleProof(
        20,
        BigInt(0),
        identityCommitments,
        IdentityCommitment
      )

      if (merkleproof.root != root) throw "root different. your transaction must be failed"

      const transaction = await InterepContract
        .connect(adminWallet)
        .removeMember(
          GROUPID,
          IdentityCommitment,
          merkleproof.siblings,
          merkleproof.pathIndices,
          {gasPrice: utils.parseUnits("10","gwei"), gasLimit: 3000000}
        )

      const receipt = await provider.waitForTransaction(transaction.hash)
      console.log(receipt.status)

      if(receipt.status) {setTransactionStatus(true)}
      else {setTransactionStatus(false)}

      setEtherscanLink("https://kovan.etherscan.io/tx/"+transaction.hash)
      setLoading(false)

      return true
    },
    []
  )

  const proveMembership = useCallback(
    async (signer: Signer, nonce = 0): Promise<boolean | undefined> => {
      const message = await signer.signMessage(
        `Sign this message to generate your ${GROUPID} Semaphore identity with key nonce: ${nonce}.`
      )

      setLoading(true)

      try {
        const response = await fetch(
          `/api/proof${qs.stringify(
            {
              message,
              GROUPID,
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
    retrieveIdentityCommitment,
    signMessage,
    joinGroup,
    leaveGroup,
    proveMembership,
    etherscanLink: _link,
    transactionstatus: _transactionStatus,
    hasjoined: _hasjoined,
    loading: _loading
  }
}
