import { NextApiRequest, NextApiResponse } from "next"
import createProof from "@interep/proof"
import { ZkIdentity, Strategy } from "@zk-kit/identity"
import getNextConfig from "next/config"
import path from "path"
import fs from "fs"

//import semaphore_final from 'static/semaphore_final.zkey'

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

  console.log(
    "data2",
    __dirname,
    getNextConfig().serverRuntimeConfig,
  )

  // const test = fs.readFile("static/semaphore_final.zkey", (err, data) => {
  //   console.log("data", data)
  // })
  try {
    res.status(200).json({
      dir: __dirname,
      serverDir: getNextConfig().serverRuntimeConfig.PROJECT_ROOT,
      test: require.resolve("static/semaphore.wasm"),
      test2: require.resolve("static/semaphore_final.zkey"),
    })
  } catch (e) {
    res.status(401).send({ error: "failed: " + e })
  }
}

export default handleMembershipProof
