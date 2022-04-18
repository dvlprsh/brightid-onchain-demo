<p align="center">
    <h1 align="center">
        BrightID onchain group
    </h1>
    <p align="center">Interep onchain group(BrightID) demo page</p>
</p>

<br>
This is a page where you can join/leave Interep on-chain groups through proof of humanity with BrightID.<br>
The current interep on-chain group ID is “brightidv1”, and group ID type is converted to uint in on-chain.
Here, BrightID is currently being authenticated with minimal steps, and users can link their brightID and register for authentication on-chain.
After that, you can join interep-brightid on-chain group.<br>

(Refer to the following link for how to get Brightid verification: [Getting-Verified](https://brightid.gitbook.io/brightid/getting-verified))
<br>
<br>

You can try the demo here: https://brightd-interep-group.vercel.app/

---

## About brightidInterep contract
Deployed contracts
|                | Kovan                                                                                          |
| -------        | ---------------------------------------------------------------------------------------------- |
| Interep        | [0xBeDb...9030](https://kovan.etherscan.io/address/0xBeDb7A22bf236349ee1bEA7B4fb4Eb2403529030) |
| BrightidInterep| [0xfe79...f9e9](https://kovan.etherscan.io/address/0xfe795B30F4A6c7D9162C4D618A6335C140DEf9e9) |

<br>
BrightidInterep contract is on-chain verification about semaphore proof and brightID off-chain cerification(with BrightID node signed)<br><br>

**Note, this is for Bright ID v5. Will be updated according to v6 coming soon<br>
<br>
Also, you can get an NFT badge for "brightidv1". This is for testing, and can only mint once through semaphore proofs.

---

## feature
The features currently provided are 
1. Join/leave to an interep on-chain group
2. Write a guestBook for the currently provided “externalNullifier”
3. Mint the NFT badge for “brightidv1” group

(2, 3 must have “brightidv1” on-chain group membership)

### Join/leave on-chain Group
First, connect your wallet to the page and have brightid on your mobile phone.
The step of generating a unique identifier(contextId) is required, currently the contextId is ETH address, and a link is created to register the contextId to the context(interep here).
This link is rendered as a QR code on our page. Users can receive off-chain authentication by scanning the QR code with their brightid.
Since we require on-chain authentication, users submit verifications signed by brightid nodes to the smart contract.
If the user successfully registers for on-chain Bright ID authentication through several conditions, the user can join “brightidv1” on-chain group.

### Write guestBook
A user with a group membership of “brightidv2” can create a guestbook for the “externalNullifier” provided on the current page only once.
The guestbook doesn't use its own database and gets the logged signals as events on-chain. (See semaphore for more information on membership proof: [Semaphore docs](https://semaphore.appliedzkp.org/))

### Mint NFT
A user with a group membership of “brightidv2” can mint the NFT badge for the group “brightidv2” only once. Please note that this NFT has no function and is for testing purposes only.

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
---

## References
You can find more details about BrightID app in [BrightID docs](https://brightid.gitbook.io/brightid/).

You can find more details about Interep onchain group in [Interep docs](https://docs.interep.link/guides/onchain-groups).
