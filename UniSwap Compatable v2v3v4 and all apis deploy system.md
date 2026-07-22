# BSC Uniswap V2/V3/V4 Stack

> **v0.6.3 correction:** Explorer/BscScan source verification has been removed completely. It is not built, configured, or run. The V2/V3/V4 deployment, swaps, PositionManager LP lifecycle, dynamic-fee hook tests, mixed routing, indexing, monitoring, and liquidity cleanup remain enabled.

<div align="center">

# BSC UNISWAP V2 / V3 / FULL V4 STACK

**Dockerized BSC Testnet deployment, executable routing, indexing, monitoring and complete liquidity cleanup.**

**Release:** `v0.6.3-full-v4-no-explorer-verification`  
**Network:** BNB Smart Chain Testnet (`chainId 97`)  
**Default:** proven V2/V3 lifecycle; full V4 is explicitly enabled with `DEPLOY_V4_SYSTEM=1`

</div>

## What changed in v0.6.2

### Complete explorer verification

The previous verifier covered only five contracts and depended on a missing Hardhat network configuration. v0.6.2 replaces that incomplete path with direct Etherscan API V2 verification for BSC Testnet (`chainId 97`).

The Docker image generates exact Solidity standard JSON inputs from the same official and local artifacts used for deployment. After smoke tests, `./dexctl verify` now verifies every stack-owned V2, V3 and V4 contract, created V2 pairs, created V3 pools, local test tokens, constructor arguments, linked libraries and the V3 descriptor proxy relationship.

When `BSCSCAN_API_KEY` is configured, any failed or missing explorer publication stops the lifecycle. With no key, on-chain bytecode and relationship checks still run and explorer publication is clearly reported as skipped.

### Full V4 retained

The previous v0.5.0 package stopped at an optional V4 singleton proof. This release retains the complete V4 system from v0.6.1:

- official V4 `PoolManager`, `StateView`, `V4Quoter`, `PositionDescriptor` and `PositionManager`;
- all V4 liquidity controlled through PositionManager NFTs;
- mint, increase, decrease, collect and burn lifecycle proof;
- bundled CREATE2-deployed dynamic-fee `beforeSwap` hook;
- permission-bit address mining, deployer-locked CREATE2 deployment and runtime hook-code verification;
- a separate V4-capable Universal Router built from `@uniswap/universal-router@2.1.0`;
- direct V4 execution and mixed V2→V4 and V4→V3 execution;
- executable `/build` calldata for routes containing V4;
- hook metadata, hook ownership/fee-update events, dynamic swap fee, V4 pools, V4 events and V4 NFT owners indexed in PostgreSQL;
- cleanup that burns every configured V4 PositionManager NFT and verifies indexed liquidity is zero;
- no use of `PoolModifyLiquidityTest` or `PoolSwapTest` in the completed V4 lifecycle.

`DEPLOY_V4_SYSTEM=0` remains the default and does not enter V4 deployment, hook, routing, smoke, indexing assertions or cleanup.

## Validation status

The V2/V3 base lifecycle was previously executed live on BSC Testnet and reached:

```text
PASS: FRESH DEPLOY -> TEST -> INDEX -> ALL DEPLOYER LIQUIDITY REMOVED
```

The v0.6.2 full-V4 and explorer-verification source has passed local static release validation. A live V4-enabled BSC Testnet run is deliberately not claimed in the package. Its acceptance condition is:

```text
PASS: FRESH V2/V3/V4 DEPLOY -> TEST -> INDEX -> ALL CONFIGURED LIQUIDITY REMOVED
```

## Full architecture

```text
BSC Testnet RPC set
        |
        v
  dexctl lifecycle
        |
        +--> Uniswap V2 Factory + Router02
        |
        +--> Uniswap V3 core + periphery + NFT positions
        |
        +--> Permit2 + proven Universal Router v1.6.0 for V2/V3
        |
        +--> DEPLOY_V4_SYSTEM=1
               |
               +--> PoolManager singleton
               +--> StateView + V4Quoter
               +--> PositionDescriptor + PositionManager NFTs
               +--> HookFactory + dynamic-fee beforeSwap hook
               +--> V4-capable Universal Router v2.1.0
               +--> static pool + dynamic-fee hook pool
        |
        v
 PostgreSQL indexer
        |
        +--> V2 pairs and reserves
        +--> V3 pools, events and NFT owners
        +--> V4 pools, hook metadata, swap fees and V4 NFT owners
        |
        +--> Route API :8088
        +--> Monitor   :8090
```

## Pinned upstream packages

```text
@uniswap/v2-core@1.0.1
@uniswap/v2-periphery@1.1.0-beta.0
@uniswap/v3-core@1.0.0
@uniswap/v3-periphery@1.1.1
@uniswap/swap-router-contracts@1.1.0
Uniswap/deploy-v3#v1.0.3
@uniswap/v4-core@1.0.2
@uniswap/v4-periphery@1.0.3
@uniswap/universal-router@2.1.0
solc@0.8.26
```

The original Universal Router v1.6.0 artifact remains the proven V2/V3 executor. The V4 module deploys its own router from v2.1.0 so disabling V4 does not change the established V2/V3 path.

## Included V4 pools

The default BSC Testnet configuration creates:

1. `WBNB / TOKEN_A`, static LP fee, zero hook address.
2. `TOKEN_A / TOKEN_B`, dynamic LP fee, bundled configurable hook.

The hook initially uses 500 hundredths of a bip and the smoke suite updates it to 700. The emitted `PoolManager.Swap` fee is checked against 700, not merely the hook storage value.

## Mixed-route accounting

For V2/V3→V4 routes, the previous command leaves the intermediate ERC-20 in the Universal Router. The V4 action plan first settles the complete router balance into PoolManager credit, then consumes that credit using `OPEN_DELTA`. This avoids encoding a stale quoted intermediate amount.

For V4→V2, V4 output is sent directly to the deterministic V2 pair. For V4→V3, the V3 command consumes the Universal Router contract balance. Every smoke route verifies that the V4-capable router retains zero TOKEN_A, TOKEN_B and WBNB afterward.

## Requirements

- WSL2 or Linux
- Docker Engine and Docker Compose
- Bash, `curl`, `jq`, `python3`, `git`, `unzip`, `sha256sum`
- dedicated BSC Testnet deployer wallet
- BSC Testnet tBNB

The proven V2/V3 profile refuses below `0.20 tBNB`. When V4 is enabled, `preflight-v4` works before any deployment manifest exists, estimates the current complete V4 gas requirement before the first on-chain transaction, and also includes temporary liquidity plus the configured final reserve.

## Install from Windows Downloads into WSL

Place these files in:

```text
C:\Users\cheyn\Downloads
```

```text
install-and-run-bsc-dex-v0.6.3-full-v4-no-explorer-verification.sh
v2n3-and-UNI-deployable-V3-contracts-v0.6.3-full-v4-no-explorer-verification.zip
```

Open WSL:

```powershell
wsl
```

Install without V4, preserving the proven V2/V3 default:

```bash
cd /mnt/c/Users/cheyn/Downloads || exit 1
chmod 700 install-and-run-bsc-dex-v0.6.3-full-v4-no-explorer-verification.sh
./install-and-run-bsc-dex-v0.6.3-full-v4-no-explorer-verification.sh --no-v4
```

Install and run the complete V2/V3/V4 lifecycle:

```bash
cd /mnt/c/Users/cheyn/Downloads || exit 1
./install-and-run-bsc-dex-v0.6.3-full-v4-no-explorer-verification.sh --v4
```

Install and validate without broadcasting transactions:

```bash
./install-and-run-bsc-dex-v0.6.3-full-v4-no-explorer-verification.sh --install-only --v4
```

The working directory is:

```text
~/bsc-uniswap-v2-v3-stack
```

The installer preserves an existing `.env` and `secrets/deployer_private_key`, archives the previous project, verifies the ZIP checksum, installs a clean source tree and validates it before any transaction.

## Fresh machine setup

```bash
cd /mnt/c/Users/cheyn/Downloads || exit 1
unzip -q v2n3-and-UNI-deployable-V3-contracts-v0.6.3-full-v4-no-explorer-verification.zip -d "$HOME"
rm -rf "$HOME/bsc-uniswap-v2-v3-stack"
mv "$HOME/v2n3-and-UNI-deployable-V3-contracts-v0.6.3-full-v4-no-explorer-verification" "$HOME/bsc-uniswap-v2-v3-stack"
cd "$HOME/bsc-uniswap-v2-v3-stack"

cp .env.example .env
mkdir -p secrets
chmod 700 secrets
printf '%s\n' '0xYOUR_BSC_TESTNET_PRIVATE_KEY' > secrets/deployer_private_key
chmod 600 .env secrets/deployer_private_key

# Full V4
sed -i 's/^DEPLOY_V4_SYSTEM=.*/DEPLOY_V4_SYSTEM=1/' .env
./run-full-fresh-test.sh
```

Never commit `.env` or `secrets/deployer_private_key`.

## Main commands

```bash
scripts/validate-release.sh "$PWD"
./dexctl preflight
./dexctl preflight-v4
./dexctl deploy
./dexctl bootstrap
./dexctl smoke
./dexctl addons
./dexctl deploy-v4
./dexctl bootstrap-v4
./dexctl smoke-v4
./dexctl verify
./dexctl cleanup-v4
./dexctl cleanup-liquidity
./dexctl status
```

The complete lifecycle remains:

```bash
./run-full-fresh-test.sh
```

## Explorer source verification

The project uses the local environment variable:

```env
BSCSCAN_API_KEY=
```

The value must be an Etherscan API V2 key with BSC Testnet access. Do not put it in Git and do not paste it into chat. Configure it through the included prompt:

```bash
cd ~/bsc-uniswap-v2-v3-stack || exit 1
./scripts/set-explorer-api-key.sh
```

Verify sources independently after a completed deployment:

```bash
./dexctl verify
jq '.' deployments/97/verification-report.json
```

The full lifecycle invokes the same verification stage automatically after contract deployment and smoke testing.

The target set includes:

- V2 Factory, Router02 and every created V2 Pair;
- V3 Factory, Multicall2, ProxyAdmin, TickLens, NFTDescriptor library, descriptor implementation and proxy, NonfungiblePositionManager, Migrator, Staker, QuoterV2, SwapRouter02 and every created V3 Pool;
- both locally deployed test ERC-20 contracts;
- Permit2 and Universal Router v1.6.0;
- V4 PoolManager, StateView, V4Quoter, PositionDescriptor, PositionManager, HookFactory, ConfigurableDynamicFeeHook and Universal Router v2.1.0.

The existing WBNB contract is excluded because the project does not deploy it. V4 pools are internal `PoolManager` state identified by `PoolId`, so there is no separate pool-contract address to verify.

A successful explorer report requires:

```text
explorer.ok = true
explorer.failedCount = 0
explorer.targetCount = explorer.verifiedCount
```

## Route API

Health:

```bash
curl -fsS http://127.0.0.1:8088/health | jq
```

Quotes include V2, V3, V4 and two-hop mixed candidates:

```bash
curl -fsS \
  'http://127.0.0.1:8088/quote?tokenIn=TOKEN_A&tokenOut=TOKEN_B&amountIn=1' | jq
```

Build executable calldata for a selected route:

```bash
curl -fsS -X POST http://127.0.0.1:8088/build \
  -H 'content-type: application/json' \
  --data '{
    "tokenIn":"TOKEN_A",
    "tokenOut":"TOKEN_B",
    "amountIn":"1",
    "routeIndex":0,
    "recipient":"0xYOUR_ADDRESS",
    "owner":"0xYOUR_ADDRESS",
    "slippageBps":500
  }' | jq
```

A V4-containing route returns `executionMode: universal-router-v4` and targets `contracts.universalRouterV4`.

## Database proof

The indexer maintains separate ownership tables to prevent V3 and V4 token-ID collisions:

```text
position_owners       # V3 NFTs
v4_position_owners    # V4 NFTs
```

It also stores:

```text
v4_pools.dynamic_fee
v4_pools.last_swap_fee
v4_pools.hooks
v4_hooks.code_hash
v4_hooks.permission_mask
v4_hooks.current_fee
```

## Cleanup proof

The V4 cleanup command:

1. reads each configured PositionManager token ID;
2. burns the NFT through official PositionManager actions;
3. receives both currencies through `TAKE_PAIR`;
4. verifies NFT ownership is the zero address / nonexistent;
5. verifies each configured V4 pool has zero liquidity;
6. unwraps only WBNB recovered by cleanup;
7. writes `deployments/97/v4-cleanup-report.json`.

The full runner then waits for the indexer to pass the cleanup block and verifies:

- V2 deployer LP balance is zero;
- all V3 pool liquidity is zero and V3 NFTs are burned;
- all V4 pool liquidity is zero;
- no V4 PositionManager NFT remains owned;
- exactly one configured hook is indexed;
- the indexed hook fee is 700;
- runtime health is green.

## Security boundary

This release is configured for BSC Testnet only. It is not a mainnet approval. Before any production deployment, perform an independent Solidity and operations review, verify all constructor arguments and bytecode, use production RPCs and secret management, verify contracts on the explorer, establish ownership and incident controls, and run a fresh funded acceptance test.

See `FULL-V4.md`, `RELEASE-v0.6.2.md`, `UPSTREAM-SOURCES.json`, `LICENSES.md`, `VALIDATION.md` and `STATIC-VALIDATION.json`.
