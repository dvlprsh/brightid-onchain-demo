<p align="center">
    <h1 align="center">
        BrightID onchain group
    </h1>
    <p align="center">Semaphore onchain group(BrightID) demo page</p>
</p>

<br>
This is a page where you can join/leave Semaphore on-chain groups through proof of humanity with BrightID.<br>
The current Semaphore on-chain group ID is “brightidOnchain”, and group ID type is converted to uint in on-chain.
Here, BrightID is currently being authenticated with minimal steps, and users can link their brightID and register for authentication on-chain.
After that, you can join brightid on-chain group.<br>

(Refer to the following link for how to get Brightid verification: [Getting-Verified](https://brightid.gitbook.io/brightid/getting-verified))
<br>
<br>

You can try the demo here: https://brightid-interep-group.vercel.app/

---

## About brightidOnchainGroup contract
Deployed contracts
|                | Kovan                                                                                          |
| -------        | ---------------------------------------------------------------------------------------------- |
| Semaphore        | [0x1972...8793](https://kovan.etherscan.io/address/0x19722446e775d86f2585954961E23771d8758793) |
| BrightidOnchainGroup| [0xb2EE...7ca7](https://kovan.etherscan.io/address/0xb2EE3750E8Ca888B9AbA20501d5b33534f847ca7) |

<br>
BrightidOnchainGroup contract is on-chain verification about semaphore proof and brightID off-chain cerification(with BrightID node signed)<br><br>

**Note, this is for Bright ID v5. Will be updated according to v6 coming soon<br>
<br>
Also, you can get an NFT badge for "brightidOnchain". This is for testing, and can only mint once through semaphore proofs.

---

## feature
The features currently provided are 
1. Join/leave to an Semaphore on-chain group
2. Write a guestBook for the currently provided “externalNullifier”
3. Mint the NFT badge for “brightidOnchain” group

(2, 3 must have “brightidOnchain” on-chain group membership)

### Join/leave on-chain Group
First, connect your wallet to the page and have brightid on your mobile phone.
The step of generating a unique identifier(contextId) is required, currently the contextId is ETH address, and a link is created to register the contextId to the context(interep here).
This link is rendered as a QR code on our page. Users can receive off-chain authentication by scanning the QR code with their brightid.
Since we require on-chain authentication, users submit verifications signed by brightid nodes to the smart contract.
If the user successfully registers for on-chain Bright ID authentication through several conditions, the user can join “brightidOnchain” on-chain group.

### Write guestBook
A user with a group membership of “brightidOnchain” can create a guestbook for the “externalNullifier” provided on the current page only once.
The guestbook doesn't use its own database and gets the logged signals as events on-chain. (See semaphore for more information on membership proof: [Semaphore docs](https://semaphore.appliedzkp.org/))

### Mint NFT
A user with a group membership of “brightidOnchain” can mint the NFT badge for the group “brightidOnchain” only once. Please note that this NFT has no function and is for testing purposes only.

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
