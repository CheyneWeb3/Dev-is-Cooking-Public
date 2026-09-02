# Split Payments Automatically on Solana with Dev Is Cooking

Getting paid on Solana is easy.

Splitting that payment between a team, creators, partners, contributors or community wallets every single time is the annoying part.

That’s what **Dev Is Cooking Payment Splitter** is built to solve.

Instead of receiving a payment into one wallet and manually sending everyone their share, you create **one payment address with the split rules already attached**.

Someone pays it.

The funds get divided according to the rules you chose.

Simple.

<p align="center">
  <img src="https://raw.githubusercontent.com/CheyneWeb3/Dev-is-Cooking-Public/refs/heads/main/PublicDocs/splitter%20image.jpg" alt="Splitter Banner" width="700">
</p>

## One address. Multiple wallets.

Imagine three people work on a project together.

Instead of customers paying one person and trusting them to manually send everyone else their share, you can create a splitter such as:

**Alice — 50%**
**Bob — 30%**
**Charlie — 20%**

Your splitter gives you one public payment address.

Send that address to customers, marketplaces, clients or anyone paying the project.

When funds arrive, the splitter distributes them according to the percentages already configured.

You can also choose an **equal split** if everyone should receive the same amount.

## Built for more than teams

Payment splitting is useful anywhere money needs to go to more than one person.

Think:

**Creator collaborations** — automatically share revenue between artists, musicians, editors and contributors.

**Project teams** — split incoming project revenue without manually handling every payment.

**DAO and community payments** — divide revenue between treasury, contributors and community wallets.

**Affiliate partnerships** — automatically allocate agreed percentages.

**Joint businesses** — one payment address with predefined revenue distribution.

**NFT projects** — split project income between creators, artists, developers and treasury.

**Services and agencies** — divide client payments between the people actually doing the work.

You don’t need to build your own payment backend just to achieve a basic revenue split.

## SOL or SPL tokens

The splitter can be created for **native SOL** or a supported **SPL token**.

So a project could have one splitter for SOL payments and another dedicated to a token such as a stablecoin or project token.

Each splitter has its own payment address and its own rules.

## Your rules live with the splitter

When you create one, you choose things such as:

* the asset being accepted;
* equal or percentage distribution;
* recipient wallets;
* each recipient’s percentage;
* a refund/recovery wallet.

The payment address is generated from a Solana program rather than being an ordinary server-controlled wallet.

That means the splitter is designed around **on-chain rules**, not somebody sitting behind a dashboard deciding where your money goes.

## Automatic or manual distribution

The goal is for payment distribution to feel almost invisible.

Funds arrive.

The system detects that funds are waiting.

The split can then be processed according to the stored rules.

There is also a **Distribute Now** option, so the system does not have to depend entirely on background automation.

If funds are waiting, an eligible connected wallet can trigger the distribution itself.

That gives users a useful fallback instead of money becoming dependent on one server or watcher being online.

## Know what is waiting

The Dev Is Cooking interface can show your splitter, its payment address, configured recipients and funds waiting to be distributed.

So rather than receiving a frightening blockchain error when there is nothing to process, the interface can simply tell you:

**0 SOL waiting**

or:

**2.4 SOL ready to distribute**

When funds are available, distribution becomes actionable.

When there is nothing there, there is nothing to do.

## Nobody should have to trust the team accountant

The useful part of a payment splitter isn’t that splitting maths is difficult.

It isn’t.

The useful part is removing this process:

**Receive money → calculate everyone's share → copy wallet addresses → make several transfers → record what was paid → repeat forever.**

And replacing it with:

**Receive payment → split.**

That becomes much more valuable when the same payment address is being used repeatedly.

## A tiny payment primitive with a lot of uses

We see the Payment Splitter less as a flashy DeFi product and more as a basic piece of useful blockchain infrastructure.

A Solana address people can actually use for business:

> **Pay this address and the money automatically goes where it is supposed to go.**

That can sit behind a website, invoice, QR code, product, donation page, subscription system, NFT project or community treasury.

The payer doesn’t need to understand the internal arrangement.

They just pay one address.

## Dev Is Cooking Payment Splitter

**One payment address.**
**Up to multiple recipients.**
**Equal or percentage splits.**
**SOL and SPL support.**
**Non-custodial PDA architecture.**
**Automatic distribution support.**
**Manual Distribute Now fallback.**
**Built directly into Dev Is Cooking.**

Create the rules once.

Share one address.

Let the splitter handle the rest.

**That’s Cooking Split.**
