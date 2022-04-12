export type StrBigInt = string | bigint

export interface VerificationsApiResponse {
  data: {
    app: string
    context: string
    contextIds: Array<string>
    unique: boolean
    sig: {
      r: string
      s: string
      v: number
    }
    timestamp: number
    publicKey: string
  }
}