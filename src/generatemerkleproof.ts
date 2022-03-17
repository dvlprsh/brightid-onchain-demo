import { IncrementalMerkleTree, MerkleProof } from "@zk-kit/incremental-merkle-tree"
import { poseidon } from "circomlibjs"
import { StrBigInt } from "./types"
/**
 * Creates a Merkle tree.
 * @param depth The depth of the tree.
 * @param zeroValue The zero value of the tree.
 * @param leaves The list of the leaves of the tree.
 * @returns The Merkle tree.
 */
export function generateMerkleTree(depth: number, zeroValue: StrBigInt, leaves: StrBigInt[]): IncrementalMerkleTree {
    const tree = new IncrementalMerkleTree(poseidon, depth, zeroValue, 2)
  
    for (const leaf of leaves) {
      tree.insert(BigInt(leaf))
    }
  
    return tree
  }

/**
 * Creates a Merkle proof.
 * @param depth The depth of the tree.
 * @param zeroValue The zero value of the tree.
 * @param leaves The list of the leaves of the tree.
 * @param leaf The leaf for which Merkle proof should be created.
 * @returns The Merkle proof.
 */
export function generateMerkleProof(
  depth: number,
  zeroValue: StrBigInt,
  leaves: StrBigInt[],
  leaf: StrBigInt
): MerkleProof {
  if (leaf === zeroValue) throw new Error("Can't generate a proof for a zero leaf")

  const tree = generateMerkleTree(depth, zeroValue, leaves)

  const leafIndex = tree.leaves.indexOf(BigInt(leaf))

  if (leafIndex === -1) {
    throw new Error("The leaf does not exists")
  }

  const merkleProof = tree.createProof(leafIndex)

  merkleProof.siblings = merkleProof.siblings.map((s) => s[0])

  return merkleProof
}
