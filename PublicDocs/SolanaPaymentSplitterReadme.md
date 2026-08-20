# Cooking Split — Solana PDA Payment Splitter

Devnet-first Solana payment splitter with one deployed Anchor program and many user-created splitter PDAs.

## V1 product rules

- **Create fee:** 0.2 SOL by default.
- **Processing fee:** 0.3% (30 bps) by default, charged on the amount processed.
- **One splitter = one asset.** Native SOL or one legacy SPL mint chosen at creation. SPL uses the splitter PDA’s canonical associated token account (ATA) as its vault.
- **Different token = different splitter.** The asset cannot be changed later.
- **Split modes:** equal or percentage.
- **Recipient limit:** 10 in V1.
- **Refund wallet:** chosen at creation and immutable.
- **Wrong assets:** recoverable wrong SPL assets can only go to the immutable refund wallet.
- **Recipient edits:** only while the accepted-asset vault has zero distributable funds.
- **Keeper:** pays transaction fees and invokes distribution; it cannot choose payout destinations.
- **Backend/database:** index/cache only. On-chain state is authoritative.
- **Token-2022:** intentionally unsupported in V1 pending an explicit extension compatibility policy and review.

Read `ARCHITECTURE.md` and `SECURITY.md` before changing program behaviour.

## Repository layout

```text
programs/payment_splitter/  Anchor/Rust program
packages/sdk/               Shared instruction/PDA/account SDK
backend/                    API, indexer, keeper and PostgreSQL migration
frontend/                   React + Reown AppKit Solana frontend
scripts/                    WSL setup, deployment, admin and smoke-test scripts
docker/cloudflared/         Tunnel config template
docker-compose.yml          Postgres/API/indexer/keeper/cloudflared stack
```

## Toolchain

Project baseline:

- Anchor CLI 1.0.2
- Solana/Agave CLI 3.1.10
- Node.js 22+
- Docker + Docker Compose

On WSL, the current Anchor documentation provides a quick toolchain installer. This repo wraps it as:

```bash
./scripts/install-toolchain-wsl.sh
```

Restart the shell after that script if it installs new PATH entries.

## 1. Clone and prepare devnet

```bash
git clone git@github.com:CheyneWeb3/payment-Splitter-sol-pda.git
cd payment-Splitter-sol-pda

cp .env.example .env
solana config set --url devnet
solana address
```

Set `PROTOCOL_TREASURY` in `.env` to the **Solana devnet treasury wallet** that should receive the 0.2 SOL creation fees and 0.3% distribution fees. If you use `./scripts/prepare-devnet.sh`, a dedicated gitignored devnet treasury keypair is generated automatically when this value is still a placeholder.

Set your existing Reown project ID:

```text
VITE_REOWN_PROJECT_ID=...
```

The frontend is kept in this repo, but Netlify deployment is intentionally outside the devnet backend deployment scope.

## 2. Generate the program ID locally

```bash
./scripts/bootstrap-program-id.sh
```

This generates:

```text
target/deploy/payment_splitter-keypair.json
```

That file is a **private deployment key and is gitignored**. The script writes its public program ID into:

- `declare_id!()` in the program
- `Anchor.toml`
- `PROGRAM_ID` and `VITE_PROGRAM_ID` in `.env`, if `.env` exists

Back up the program keypair securely before mainnet. Do not commit it.

## 3. Install JS dependencies and run local checks

```bash
npm install
npm test
npm run typecheck
npm run build
```

Commit `package-lock.json` after the first successful `npm install`. Also commit the generated `Cargo.lock` after the first successful Rust/Anchor build so JS, Docker/Netlify and verifiable program builds are all locked.

## 4. Build the Solana program

```bash
anchor --version
solana --version
./scripts/build-program.sh
```

The script performs both a normal Anchor build and a Docker-backed verifiable build.

## 5. Fund the devnet deploy wallet

```bash
solana config set --url devnet
solana balance
solana airdrop 2
```

Devnet faucet rate limits can apply. Use the Solana devnet faucet if CLI airdrops are rate-limited.

## 6. Deploy the exact program ID to devnet

```bash
./scripts/deploy-devnet.sh
```

The deploy script refuses to continue if `.env` and the local program keypair disagree about the program ID.

Verify manually:

```bash
solana program show "$PROGRAM_ID" --url devnet
```

If your shell has not loaded `.env`, use:

```bash
set -a
source .env
set +a
solana program show "$PROGRAM_ID" --url devnet
```

## 7. Initialize the protocol once

The initializer wallet defaults to `~/.config/solana/id.json` and becomes the protocol config authority.

```bash
./scripts/initialize-devnet.sh
```

Then inspect the on-chain config:

```bash
./scripts/show-config.sh
```

Expected defaults:

```text
creationFeeLamports: 200000000
processingFeeBpsForNewSplitters: 30
maxRecipients: 10
paused: false
```

To update config for **future** splitter creation:

```bash
CREATION_FEE_LAMPORTS=200000000 \
PROCESSING_FEE_BPS=30 \
MAX_RECIPIENTS=10 \
PROTOCOL_PAUSED=false \
node --env-file=.env scripts/admin.mjs update-config
```

Existing splitters retain the processing fee snapshotted when they were created.

### Transfer protocol authority safely

Protocol authority uses a two-step handover. The current authority proposes a new public key, then the proposed authority must sign acceptance with its own wallet:

```bash
node --env-file=.env scripts/admin.mjs propose-authority <NEW_AUTHORITY_PUBKEY>

# On the new authority machine/wallet, point SOLANA_WALLET at its keypair:
SOLANA_WALLET=/secure/path/new-authority.json \
  node --env-file=.env scripts/admin.mjs accept-authority
```

`show-config.sh` reports `pendingAuthority` until acceptance succeeds. This protocol authority is separate from the Solana program upgrade authority; plan both before mainnet.

## 8. Run the on-chain devnet smoke test

```bash
./scripts/smoke-devnet.sh
```

The smoke test:

1. records the devnet treasury SOL balance;
2. creates a real SOL splitter;
3. proves the treasury balance increased by exactly the configured 0.2 SOL creation fee;
4. deposits 0.1 devnet SOL into its payment vault;
5. triggers distribution;
6. verifies the treasury received exactly 30 bps;
7. verifies the 60/40 recipient balances exactly match the post-fee amount.

It fails loudly if the on-chain balances do not reconcile.

Then run the SPL + wrong-token recovery smoke test:

```bash
./scripts/smoke-token-devnet.sh
```

This creates a disposable devnet SPL mint, verifies the splitter PDA’s canonical ATA vault, a real token distribution and 30 bps fee, then creates a second wrong mint controlled by the splitter PDA and verifies that `sweep_wrong_token` transfers the entire wrong balance to the immutable refund wallet's token account.

Finally prove the two-step protocol-authority handover and restore authority to the original devnet admin wallet:

```bash
./scripts/smoke-authority-devnet.sh
```

This test generates a temporary in-memory authority, funds it with a small amount of devnet SOL for transaction fees, verifies `propose -> accept`, then performs the same two steps back to the original authority.

## 9. Generate the keeper wallet

```bash
./scripts/generate-keeper.sh
```

Fund the printed address with **devnet SOL only**:

```bash
solana airdrop 1 <KEEPER_PUBKEY> --url devnet
```

The keeper key only pays for/authorizes its own caller transaction. The program does not grant it authority to redirect splitter funds.

## 10. Start the Docker stack without public ingress

```bash
docker compose up -d --build postgres migrate api indexer keeper
docker compose ps
curl -s http://127.0.0.1:3901/health
curl -s http://127.0.0.1:3901/v1/config
```

Expected services:

```text
postgres
api
indexer
keeper
```

The API host port binds to `127.0.0.1` only. Public access is provided by Cloudflare Tunnel, not by exposing the API port directly.

## 11. Create the devnet Cloudflare Tunnel and DNS from WSL CLI

The planned devnet endpoint is:

```text
https://split-api-devnet.inhaus.technology
```

Run:

```bash
./scripts/setup-cloudflare-devnet.sh
```

The script performs the CLI flow:

```text
cloudflared tunnel login                 # only when cert.pem is absent
cloudflared tunnel create cooking-split-devnet
cloudflared tunnel route dns <UUID> split-api-devnet.inhaus.technology
```

It then copies the generated tunnel credential into the gitignored `secrets/` directory and writes the local Docker tunnel config.

Start the tunnel profile:

```bash
docker compose --profile tunnel up -d --build
```

Verify:

```bash
curl -s https://split-api-devnet.inhaus.technology/health
curl -s https://split-api-devnet.inhaus.technology/v1/config
```

## 12. Frontend development

The frontend uses Reown AppKit's Solana adapter and the connected wallet signs the actual program transactions.

```bash
npm run dev:frontend
```

V1 frontend functions include:

- connect Solana wallet;
- create SOL or legacy SPL splitter;
- equal or percentage split;
- immutable refund wallet;
- real program transaction signing;
- display and copy the actual payment vault address;
- list the connected creator's indexed splitters;
- manually trigger distribution in addition to the keeper;
- pay a splitter atomically from the app (SOL or SPL);
- edit recipient rules/mode while the accepted vault is empty;
- pause/resume a splitter;
- wrong SPL-token sweep to the fixed refund wallet;
- excess SOL sweep from the splitter state PDA to the fixed refund wallet.

The repo contains `netlify.toml`, but creating/configuring the Netlify site is deliberately not part of this backend/devnet deployment phase.

## Payment flow

### Direct-address payment

```text
payer
  -> splitter payment vault
  -> keeper detects funded vault
  -> keeper calls distribute
  -> 0.3% protocol treasury
  -> remaining 99.7% recipients
```

The keeper cannot provide replacement recipients. The program validates the exact on-chain recipient list against the transaction accounts.

### Atomic app payment

The frontend and shared SDK expose `pay_and_split_sol` and `pay_and_split_token`. These let an app payment send the protocol fee and recipient shares in the same payment transaction without waiting for the keeper. For SPL, any missing treasury/recipient ATAs are prepared first in separate setup transactions so account creation does not bloat the actual payment instruction.

## SPL payment addresses

For an SPL splitter, the accepted-token vault is the **canonical associated token account (ATA)** whose owner/authority is the splitter PDA and whose mint is fixed at creation. An ordinary transfer of a different mint into that ATA is rejected because token accounts are mint-specific.

If an external sender instead creates/sends the wrong mint to another token account owned by the splitter PDA (commonly that wrong mint's ATA), the recovery instruction can sweep it. Its destination is not caller-supplied: the destination token account must be owned by the splitter's immutable refund wallet.

## Accidental SOL recovery

There are two cases:

1. SOL sent to the program-owned **splitter state PDA**: `sweep_excess_sol_from_splitter` returns only lamports above the account rent floor to the immutable refund wallet.
2. SOL sent to an SPL **token vault account**: SPL Token owns that account, so arbitrary lamport mutation is not permitted. V1 provides `close_empty_token_vault_for_sol_recovery` when the accepted token balance is zero; closing returns the account lamports to the immutable refund wallet. The creator can then recreate the same deterministic token vault with `reopen_token_vault`.

## Mainnet is intentionally not a normal switch yet

The source is mainnet-ready, but production deployment is gated.

- `.env.mainnet.example` is included.
- `scripts/deploy-mainnet.sh` refuses to deploy unless `ALLOW_MAINNET_DEPLOY=I_UNDERSTAND` is explicitly set.
- the keeper independently refuses mainnet unless `ALLOW_MAINNET_KEEPER=true`.
- use a separate mainnet treasury, keeper and Cloudflare tunnel.
- do not reuse devnet secret keys on mainnet.

Before mainnet, perform the security work listed in `SECURITY.md` and decide how the program upgrade authority and protocol config authority will be secured (for example, a multisig/governance setup rather than a single hot key).

## Useful operations

```bash
# Stack status
docker compose ps

# API logs
docker compose logs -f --tail=200 api

# Keeper logs
docker compose logs -f --tail=200 keeper

# Indexer logs
docker compose logs -f --tail=200 indexer

# Tunnel logs
docker compose --profile tunnel logs -f --tail=200 cloudflared

# Protocol config
./scripts/show-config.sh

# Repeat devnet smoke test
./scripts/smoke-devnet.sh
```

## Git safety check

Before pushing:

```bash
git status --short
git ls-files | grep -E '(^|/)(\.env|secrets/|target/deploy/.*keypair)' && echo "STOP: secret-like file tracked" || true
```

Private wallets, `.env`, program keypairs and tunnel credentials must never be committed.
