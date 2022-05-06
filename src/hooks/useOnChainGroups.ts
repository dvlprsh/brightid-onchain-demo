import { useCallback, useState } from "react"
import { Signer, Contract, providers, Wallet, utils } from "ethers"
import createIdentity from "@interep/identity"
import Semaphore from "contract-artifacts/Semaphore.json"
import BrightidOnchain from "contract-artifacts/BrightidOnchainGroup.json"
import getNextConfig from "next/config"
import { generateMerkleProof } from "@zk-kit/protocols"
import { HashZero } from "@ethersproject/constants"
import {
  toUtf8Bytes,
  concat,
  hexlify,
  formatBytes32String
} from "ethers/lib/utils"
import { Bytes31 } from "soltypes"
import createProof from "@interep/proof"

function formatUint248String(text: string): string {
  const bytes = toUtf8Bytes(text)

  if (bytes.length > 30) {
    throw new Error("byte31 string must be less than 31 bytes")
  }

  const hash = new Bytes31(hexlify(concat([bytes, HashZero]).slice(0, 31)))
  return hash.toUint().toString()
}

const provider = new providers.JsonRpcProvider(
  `https://kovan.infura.io/v3/${
    getNextConfig().publicRuntimeConfig.infuraApiKey
  }` // kovan
)
const SemaphoreContract = new Contract(
  "0x19722446e775d86f2585954961E23771d8758793",
  Semaphore.abi,
  provider
)
const BrightidOnchainContract = new Contract(
  "0xb2EE3750E8Ca888B9AbA20501d5b33534f847ca7",
  BrightidOnchain.abi,
  provider
)

//const GROUP_NAME = "brightidv1"
const GROUPID = "1000"//formatUint248String("brightidOnchain")//173940653116352066108267866021843083307125310770256553050992487833486229504
const EX_NULLIFIER = BigInt(formatUint248String("guestbook-season1"))//BigInt(formatUint248String("guestbook-season1")) //guessbook-season1
const ADMIN = getNextConfig().publicRuntimeConfig.adminprivatekey
const adminWallet = ADMIN && new Wallet(ADMIN, provider)

async function getGroup(id: string) {
  const endPoint =
    "https://thegraph.com/hosted-service/subgraph/semaphore-protocol/kovan"
  const query = `{
    groups(where: { id: "${id}" }) {
        id
        depth
        zeroValue
        size
        numberOfLeaves
        root
        admin
      }
    }`
  const response = await fetch(endPoint, {
    method: "POST",
    headers: {"Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
  console.log(response)
  return response.json()
}

async function getGroupMembers(groupId: string) {
  const endPoint =
  "https://thegraph.com/hosted-service/subgraph/semaphore-protocol/kovan"
const query = `{
  members(where: { group: "${groupId}" }, orderBy: index) {
      id
      identityCommitment
      index
    }
  }`
const response = await fetch(endPoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query })
})

return response.json()
}

type ReturnParameters = {
  signMessage: (signer: Signer, message: string) => Promise<string | null>
  retrieveIdentityCommitment: (signer: Signer) => Promise<string | null>
  joinGroup: (identityCommitment: string) => Promise<true | null>
  leaveGroup: (identityCommitment: string) => Promise<true | null>
  proveMembership: (signer: Signer, signal: string) => Promise<any>
  mintNFT: (signer: Signer) => Promise<any>
  loadGuestBook: () => Promise<string[] | null>
  memberCount: () => Promise<number | null>
  etherscanLink?: string
  transactionstatus?: boolean
  hasjoined: boolean
  loading: boolean
}

export default function useOnChainGroups(): ReturnParameters {
  const [_loading, setLoading] = useState<boolean>(false)
  const [_link, setEtherscanLink] = useState<string>()
  const [_transactionStatus, setTransactionStatus] = useState<boolean>()
  const [_hasjoined, setHasjoined] = useState<boolean>(false)
  const signMessage = useCallback(
    async (signer: Signer, message: string): Promise<string | null> => {
      try {
        setLoading(true)

        const signedMessage = await signer.signMessage(message)

        setLoading(false)
        return signedMessage
      } catch (error) {
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
      const identityCommitment = identity.genIdentityCommitment()
      const members = await getGroupMembers(GROUPID)

      const identityCommitments = members.map(
        (member: any) => member.identityCommitment
      )

      const hasJoined = identityCommitments.includes(
        identityCommitment.toString()
      )
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

      const transaction = await SemaphoreContract.connect(adminWallet).addMember(
        GROUPID,
        identityCommitment,
        { gasPrice: utils.parseUnits("3", "gwei"), gasLimit: 3000000 }
      )

      const receipt = await provider.waitForTransaction(transaction.hash)

      setTransactionStatus(!!receipt.status)

      setEtherscanLink("https://kovan.etherscan.io/tx/" + transaction.hash)
      setLoading(false)
      return true
    },
    []
  )

  const leaveGroup = useCallback(
    async (IdentityCommitment: string): Promise<true | null> => {
      if (!adminWallet) return null

      setLoading(true)

      const { root } = await getGroup(GROUPID)
      const members = await getGroupMembers(GROUPID)

      const indexedMembers = members
        .map((member: any) => [member.index, member.identityCommitment])
        .sort()
      const identityCommitments = indexedMembers.map((member: any) => member[1])

      const merkleproof = generateMerkleProof(
        20,
        BigInt(0),
        identityCommitments,
        IdentityCommitment
      )

      if (merkleproof.root != root)
        throw "root different. your transaction must be failed"

      const transaction = await SemaphoreContract.connect(
        adminWallet
      ).removeMember(
        GROUPID,
        IdentityCommitment,
        merkleproof.siblings,
        merkleproof.pathIndices,
        { gasPrice: utils.parseUnits("3", "gwei"), gasLimit: 3000000 }
      )

      const receipt = await provider.waitForTransaction(transaction.hash)

      setTransactionStatus(!!receipt.status)

      setEtherscanLink("https://kovan.etherscan.io/tx/" + transaction.hash)
      setLoading(false)

      return true
    },
    []
  )

  const proveMembership = useCallback(
    async (signer: Signer, signal: string, nonce = 0) => {
      setLoading(true)
      const externalNullifier = EX_NULLIFIER
      try {
        const identity = await createIdentity(
          (message) => signer.signMessage(message),
          GROUPID
        )
        const zkFiles = {
          wasmFilePath: "/static/semaphore.wasm",
          zkeyFilePath: "/static/semaphore_final.zkey"
        }

        const { publicSignals, solidityProof } = await createProof(
          identity,
          GROUPID,
          externalNullifier,
          signal,
          zkFiles
        )
        const transaction = await BrightidOnchainContract.connect(
          signer
        ).leaveMessage(
          GROUPID,
          formatBytes32String(signal),
          publicSignals.nullifierHash,
          externalNullifier,
          solidityProof,
          { gasPrice: utils.parseUnits("3", "gwei"), gasLimit: 3000000 }
        )
        const receipt = await provider.waitForTransaction(transaction.hash)

        setTransactionStatus(!!receipt.status)
        setEtherscanLink("https://kovan.etherscan.io/tx/" + transaction.hash)
        setLoading(false)
        return true
      } catch (error) {
        setLoading(false)
        throw error
      }
    },
    []
  )

  const loadGuestBook = useCallback(async () => {
    const startblock = 30970366
    const filter = BrightidOnchainContract.filters.saveMessage(
      utils.hexlify(EX_NULLIFIER)
    ) //externalnullifier

    const filterEvent = await BrightidOnchainContract.queryFilter(
      filter,
      startblock
    )

    let signalList = []
    for (let i = 0; i < filterEvent.length; i++) {
      signalList.push(utils.parseBytes32String(filterEvent[i].data))
    }
    return signalList
  }, [])

  const mintNFT = useCallback(async (signer: Signer, nonce = 0) => {
    setLoading(true)

    try {
      const identity = await createIdentity(
        (message) => signer.signMessage(message),
        GROUPID
      )
      const zkFiles = {
        wasmFilePath: "/static/semaphore.wasm",
        zkeyFilePath: "/static/semaphore_final.zkey"
      }

      const { publicSignals, solidityProof } = await createProof(
        identity,
        GROUPID,
        GROUPID,
        "brightidOnchainGroup-nft",
        zkFiles
      )
      const transaction = await BrightidOnchainContract.connect(signer).mint(
        publicSignals.nullifierHash,
        solidityProof,
        { gasPrice: utils.parseUnits("3", "gwei"), gasLimit: 3000000 }
      )

      const receipt = await provider.waitForTransaction(transaction.hash)

      setTransactionStatus(!!receipt.status)
      setEtherscanLink("https://kovan.etherscan.io/tx/" + transaction.hash)
      setLoading(false)
      return true
    } catch (error) {
      setLoading(false)
      throw error
    }
  }, [])

  const memberCount = useCallback(async () => {
    const { size } = await getGroup(GROUPID)
    return size
  }, [])

  return {
    retrieveIdentityCommitment,
    signMessage,
    joinGroup,
    leaveGroup,
    proveMembership,
    mintNFT,
    loadGuestBook,
    memberCount,
    etherscanLink: _link,
    transactionstatus: _transactionStatus,
    hasjoined: _hasjoined,
    loading: _loading
  }
}
