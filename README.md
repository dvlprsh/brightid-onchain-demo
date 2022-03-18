<p align="center">
    <h1 align="center">
        BrightID onchain group
    </h1>
    <p align="center">Interep onchain group(BrightID) demo page</p>
</p>

This is a demo page that allows users to join/leave BrightID onchain group.
You can Link your BrightID account and Ethereum address by taking the QRcode with BrightID mobile app. 
Then you can join or leave the BrightID on-chain group.

---

## Install

Clone this repository and install the dependencies:

```bash
git clone https://github.com/dvlprsh/interep-onchain-demo.git
cd interep-onchain-demo
yarn # or `npm i`
```

## Usage

### Running test

```bash
yarn test
```

### Running page locally

Create your Interep onchain group to test locally.
You can find more details about creating an Interep onchain groups in [Interep docs](https://docs.interep.link/guides/onchain-groups). You have to modify `groupId` variable manually in `useOnChainGorups.ts` to your group ID.

```ts
const groupId = "" // your group Id
```

Copy the `.env.example` file and rename it `.env`.
Then set the private key in `.env`:

```bash
BRIGHTID_GROUP_ADMIN_PRIVATE_KEY="..." # private key of the Ethereum address that made your onchain group
```

Now run `yarn dev` (or `npm run dev`)
```bash
yarn dev
```

### Join/Leave group
First, you need a BrightID account and should link it to the Interep with a QR code.
You can find more details about BrightID app in [BrightID docs](https://brightid.gitbook.io/brightid/).

After Linking your account, you can join/leave BrightID onchain Interep group in this page.