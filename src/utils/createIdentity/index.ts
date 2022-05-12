import { ZkIdentity, Strategy } from "@zk-kit/identity"
import checkParameter from "./checkParameter"

export default async function createIdentity(
  sign: (message: string) => Promise<string>,
  groupId: string,
  nonce = 0
): Promise<ZkIdentity> {
  checkParameter(sign, "sign", "function")
  checkParameter(groupId, "groupId", "string")
  checkParameter(nonce, "nonce", "number")

  const message = await sign(
    `Sign this message to generate your ${groupId} Semaphore identity with key nonce: ${nonce}.`
  )

  return new ZkIdentity(Strategy.MESSAGE, message)
}
