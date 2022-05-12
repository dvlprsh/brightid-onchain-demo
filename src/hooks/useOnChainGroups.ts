import { useCallback, useState } from "react"
import { Signer, Contract, providers, Wallet, utils } from "ethers"
import createIdentity from "../utils/createIdentity"
import Semaphore_contract from "contract-artifacts/Semaphore.json"
import BrightidOnchain from "contract-artifacts/BrightidOnchainGroup.json"
import onchainAPI from "./OnchainAPI"
import getNextConfig from "next/config"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import { HashZero } from "@ethersproject/constants"
import {
  toUtf8Bytes,
  concat,
  hexlify,
  formatBytes32String
} from "ethers/lib/utils"
import { Bytes31 } from "soltypes"

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
  Semaphore_contract.abi,
  provider
)
const BrightidOnchainContract = new Contract(
  "0xb2EE3750E8Ca888B9AbA20501d5b33534f847ca7",
  BrightidOnchain.abi,
  provider
)

const GROUPID = formatUint248String("brightidOnchain")
const EX_NULLIFIER = BigInt(formatUint248String("guestbook-season1"))
const ADMIN = getNextConfig().publicRuntimeConfig.adminprivatekey
const adminWallet = ADMIN && new Wallet(ADMIN, provider)

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
      const api = new onchainAPI()
      const members = await api.getGroupMembers(GROUPID)

      const identityCommitments = members.map((member:any)=> member.identityCommitment)

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

      const api = new onchainAPI()
      const { root } = await api.getGroup(GROUPID)
      const members = await api.getGroupMembers(GROUPID)

      const identityCommitments = members.map((member:any)=> member.identityCommitment)

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
        const identityCommitment = identity.genIdentityCommitment().toString()
        const zkFiles = {
          wasmFilePath: "/static/semaphore.wasm",
          zkeyFilePath: "/static/semaphore_final.zkey"
        }

        const api = new onchainAPI()
        const {depth} = await api.getGroup(GROUPID)
        const members = await api.getGroupMembers(GROUPID)
        const identityCommitments = members.map((member: any) => member.identityCommitment)

        const merkelProof = generateMerkleProof(depth, BigInt(0), identityCommitments, identityCommitment)

        const witness = Semaphore.genWitness(
          identity.getTrapdoor(),
          identity.getNullifier(),
          merkelProof,
          BigInt(externalNullifier),
          signal
        )
        const { publicSignals, proof } = await Semaphore.genProof(witness, zkFiles.wasmFilePath, zkFiles.zkeyFilePath)
        const solidityProof = Semaphore.packToSolidityProof(proof)

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
      const identityCommitment = identity.genIdentityCommitment().toString()
      const zkFiles = {
        wasmFilePath: "/static/semaphore.wasm",
        zkeyFilePath: "/static/semaphore_final.zkey"
      }

      const api = new onchainAPI()
      const {depth} = await api.getGroup(GROUPID)
      const members = await api.getGroupMembers(GROUPID)
      const identityCommitments = members.map((member: any) => member.identityCommitment)

      const merkelProof = generateMerkleProof(depth, BigInt(0), identityCommitments, identityCommitment)

      const witness = Semaphore.genWitness(
        identity.getTrapdoor(),
        identity.getNullifier(),
        merkelProof,
        GROUPID,
        "brightidOnchainGroup-nft"
      )
      const { publicSignals, proof } = await Semaphore.genProof(witness, zkFiles.wasmFilePath, zkFiles.zkeyFilePath)
      const solidityProof = Semaphore.packToSolidityProof(proof)

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
    const api = new onchainAPI()
    const { size } = await api.getGroup(GROUPID)
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
