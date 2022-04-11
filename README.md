<p align="center">
    <h1 align="center">
        BrightID onchain group
    </h1>
    <p align="center">Interep onchain group(BrightID) demo page</p>
</p>

This is a demo page that allows users to join/leave BrightID onchain group.
You can Link your BrightID account and Ethereum address by taking the QRcode with BrightID mobile app. 
Then you can join or leave the BrightID onchain group.

You can try the demo here: https://brightid-on-chain.netlify.app/

---

## Install

Clone this repository and install the dependencies:

```bash
git clone https://github.com/dvlprsh/brightid-onchain-demo.git
cd brightid-onchain-demo
yarn # or `npm i`
```

## Usage

### Running test

```bash
yarn test
```

### Running page locally

run `yarn dev` (or `npm run dev`)
```bash
yarn dev
```

### Join/Leave group
First, you need a BrightID account and should link it to the Interep with a QR code.
You can find more details about BrightID app in [BrightID docs](https://brightid.gitbook.io/brightid/).

After Linking your account, you can join/leave BrightID onchain Interep group in this page.
You can find more details about Interep onchain group in [Interep docs](https://docs.interep.link/guides/onchain-groups).

<br>

## About brightidInterep contract
Deployed contracts
|                | Kovan                                                                                          |
| -------        | ---------------------------------------------------------------------------------------------- |
| Interep        | [0x5B8e...a6dc](https://kovan.etherscan.io/address/0x5B8e7cC7bAC61A4b952d472b67056B2f260ba6dc) |
| BrightidInterep| [0xc031...FBc0](https://kovan.etherscan.io/address/0xc031d67f28fd31163ab91283bb4a3a977a26fbc0) |

<br>
BrightidInterep contract is on-chain verification about semaphore proof and brightID off-chain cerification(with BrightID node signed)<br><br>

**Note, this is for Bright ID v5. Will be updated according to v6 coming soon<br>
<br>
Also, you can get an NFT badge for brightidv1. This is for testing, and can only mint once through semaphore proofs.
