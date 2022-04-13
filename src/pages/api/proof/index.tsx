import { NextApiRequest, NextApiResponse } from "next"
import createProof from "@interep/proof"
import { ZkIdentity, Strategy } from "@zk-kit/identity"
import getConfig from "next/config"
import path from "path"

interface Query {
  message: string
  groupId: string
  signal: string
  externalNullifier: string
}

const handleMembershipProof = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { message, groupId, signal, externalNullifier } =
    req.query as unknown as Query

  try {
    const zkFiles = {
      wasmFilePath:
        "https://image.shutterstock.com/image-photo/small-kettle-heated-on-bonfire-600w-1822074260.jpg",
      zkeyFilePath:
        "https://bright-id-on-chain.s3.ap-northeast-2.amazonaws.com/semaphore_final.zkey"
    }

    const identity = new ZkIdentity(Strategy.MESSAGE, message)

    const { publicSignals, solidityProof } = await createProof(
      identity,
      groupId,
      externalNullifier,
      signal,
      zkFiles
    )

    res.status(200).json({ publicSignals, solidityProof })
  } catch (e) {
    res.status(401).send({ error: "failed: " + e })
  }
}

export default handleMembershipProof
