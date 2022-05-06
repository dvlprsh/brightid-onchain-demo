import { AxiosRequestConfig } from "axios"
import request from "./request"

export default class onchainAPI {
    url: string

    constructor() {
        this.url = "https://api.thegraph.com/subgraphs/name/semaphore-protocol/kovan"
    }

    async getGroup(id: string): Promise<any> {

        const config: AxiosRequestConfig = {
            method: "post",
            data: JSON.stringify({
                query: `{
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
            })
        }

        const { groups } = await request(this.url, config)

        return groups[0]
    }

    async getGroupMembers(groupId: string): Promise<any> {

        const config: AxiosRequestConfig = {
            method: "post",
            data: JSON.stringify({
                query: `{
                    members(where: { group: "${groupId}" }) {
                        id
                        identityCommitment
                        index
                    }
                }`
            })
        }

        const { members } = await request(this.url, config)

        return members
    }
}