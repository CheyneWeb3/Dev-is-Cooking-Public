<div align="center">

# BSC Uniswap V2 / V3 / V4 Deployment Stack

**A complete Dockerized Uniswap deployment, testing, routing, indexing, monitoring, and liquidity-cleanup system for BNB Smart Chain Testnet.**

[![Network](https://img.shields.io/badge/network-BSC%20Testnet-F0B90B?style=for-the-badge&logo=binance&logoColor=black)](#network)
[![Chain ID](https://img.shields.io/badge/chain%20ID-97-1f6feb?style=for-the-badge)](#network)
[![Release](https://img.shields.io/badge/release-v0.6.3-2ea44f?style=for-the-badge)](#validated-release)
[![Uniswap](https://img.shields.io/badge/Uniswap-V2%20%2B%20V3%20%2B%20V4-ff007a?style=for-the-badge&logo=uniswap&logoColor=white)](#system-overview)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=for-the-badge&logo=docker&logoColor=white)](#runtime-services)

**Repository:** `CheyneWeb3/v2n3-and-UNI-deployable-V3-contracts`

</div>

---

## Validated release

| Field | Value |
|---|---|
| Release | `v0.6.3` |
| Git tag | `v0.6.3-full-v4-no-explorer` |
| Validated network | BNB Smart Chain Testnet |
| Chain ID | `97` |
| Validated date | 22 July 2026 |
| Docker image | `local/bsc-uniswap-v2-v3-stack:0.6.3` |
| Deployment wallet | `0x4AC05c9075568602be526AE4eEb3be0b5Fcd5342` |
| Full V4 toggle | `DEPLOY_V4_SYSTEM=1` |
| Source verification | Not included |
| Runtime state after validation | PostgreSQL, indexer, route API, and monitor healthy |

The complete fresh lifecycle passed on BSC Testnet:

```text
PASS: FRESH V2/V3/V4 DEPLOY -> TEST -> INDEX -> ALL CONFIGURED LIQUIDITY REMOVED
```

The validated run proved:

- Fresh V2 Factory and Router02 deployment.
- Fresh V3 core and periphery deployment.
- Fresh `tUSDC` and `tDEX` test-token deployment.
- Two V2 pairs and two V3 concentrated-liquidity positions.
- Direct V2 and V3 swaps.
- V3 position increase, decrease, fee collection, full removal, and NFT burns.
- Permit2 and Universal Router v1.6.0 deployment.
- Universal Router direct V2, direct V3, and mixed V2-to-V3 execution.
- Full V4 singleton and periphery deployment.
- Static-fee and dynamic-fee V4 pools.
- Official V4 PositionManager NFT mint, increase, decrease, removal, and burn lifecycle.
- A configurable `beforeSwap` dynamic-fee hook.
- V4-capable Universal Router v2.1.0 execution.
- Direct V4, mixed V2-to-V4, and mixed V4-to-V3 swaps.
- Executable V4 calldata generation through the route API.
- Fresh PostgreSQL indexing of V2, V3, V4, hook, position, and swap state.
- Complete deployer-controlled liquidity cleanup.
- Final indexed zero-liquidity verification.
- Healthy runtime services after cleanup.

---

## System overview

This repository deploys three generations of Uniswap as one reproducible BSC Testnet system.

### Uniswap V2

V2 uses separate pair contracts and fungible LP tokens.

Included:

- `UniswapV2Factory`
- `UniswapV2Router02`
- Pair creation
- Constant-product liquidity
- Direct V2 swaps
- Universal Router V2 execution
- Complete deployer-owned LP removal

### Uniswap V3

V3 uses separate pool contracts and concentrated-liquidity NFT positions.

Included:

- `UniswapV3Factory`
- `UniswapInterfaceMulticall`
- `ProxyAdmin`
- `TickLens`
- `NFTDescriptor`
- `NonfungibleTokenPositionDescriptor`
- `TransparentUpgradeableProxy`
- `NonfungiblePositionManager`
- `V3Migrator`
- `UniswapV3Staker`
- `QuoterV2`
- `SwapRouter02`
- Pool creation and initialization
- Concentrated-liquidity NFT minting
- Increase, decrease, collect, full removal, and NFT burn tests

### Uniswap V4

V4 stores all pool state inside a single `PoolManager` singleton. Pools are identified by a `PoolKey` and resulting `PoolId`, rather than by an independently deployed pool contract.

Included:

- `PoolManager`
- `StateView`
- `V4Quoter`
- `PositionDescriptor`
- `PositionManager`
- `HookFactory`
- `ConfigurableDynamicFeeHook`
- V4-capable Universal Router v2.1.0
- Static-fee no-hook pool
- Dynamic-fee hooked pool
- PositionManager liquidity NFTs
- Mint, increase, decrease, remove, and burn lifecycle
- Direct and mixed V2/V3/V4 route execution
- PostgreSQL pool, hook, swap, and position indexing

Pinned V4 packages:

```text
@uniswap/v4-core@1.0.2
@uniswap/v4-periphery@1.0.3
@uniswap/universal-router@2.1.0
solc@0.8.26
```

---

## Architecture

```text
                                  BSC Testnet RPCs
                                         |
                                         v
                              +-----------------------+
                              |        dexctl         |
                              | deployment + testing  |
                              +-----------+-----------+
                                          |
                 +------------------------+------------------------+
                 |                        |                        |
                 v                        v                        v
       +------------------+     +------------------+     +----------------------+
       |   Uniswap V2     |     |   Uniswap V3     |     |     Uniswap V4       |
       | Factory + pairs  |     | Factory + pools  |     | PoolManager singleton|
       | Router02         |     | NFT positions    |     | hooks + NFT positions|
       +--------+---------+     +---------+--------+     +----------+-----------+
                |                         |                         |
                +-------------------------+-------------------------+
                                          |
                                          v
                           +------------------------------+
                           | Permit2 + Universal Routers  |
                           | v1.6.0 for V2/V3             |
                           | v2.1.0 for V2/V3/V4          |
                           +---------------+--------------+
                                           |
                                           v
                              +--------------------------+
                              | PostgreSQL event index   |
                              | V2 + V3 + V4 + hooks     |
                              +------------+-------------+
                                           |
                           +---------------+----------------+
                           |                                |
                           v                                v
                 +-------------------+            +-------------------+
                 | Route API :8088   |            | Monitor :8090     |
                 | quote + build     |            | health + RPC lag  |
                 +-------------------+            +-------------------+
```

---

## How V4 works in this stack

### PoolManager singleton

V4 pools do not have their own deployed contract address. Every V4 pool lives inside:

```text
PoolManager: 0xbf27C8273Fd07b6A14f536cc6d32989176F57352
```

A pool is identified by:

```text
currency0
currency1
fee
tickSpacing
hooks
```

Those values form the `PoolKey`, which is hashed into a `PoolId`.

### V4 PositionManager NFTs

V4 liquidity positions are ERC-721 NFTs managed through:

```text
PositionManager: 0x42Fe6cBaf11EB4d48114b0CA88a7DB2a60637C9C
```

Each NFT controls liquidity for:

- One V4 pool.
- A selected tick range.
- A specific liquidity amount.
- The position’s fee entitlement.
- The NFT owner.

The validated lifecycle performed:

```text
initialize pool
→ mint position NFT
→ increase liquidity
→ decrease test liquidity
→ retain remaining active liquidity
→ execute swaps
→ remove all remaining liquidity
→ take both currencies
→ burn position NFT
```

Both V4 position NFTs were burned during cleanup and their final indexed owner was the zero address.

### Dynamic-fee hook

The stack deploys a bundled hook implementing the V4 `beforeSwap` callback:

```text
HookFactory:
0x92951977D0a6B1E8eeB0068c74DfE87Aa680fa40

ConfigurableDynamicFeeHook:
0xCc949F126EC57507Bdb6C8e42E565Fc13f9dC080
```

The hook address contains the required V4 permission bit:

```text
permissionMask = 128
beforeSwap enabled
```

The test lifecycle:

1. Initialized the dynamic-fee pool at `500` hundredths of a basis point.
2. Updated the configured fee to `700`.
3. Executed a real Universal Router V4 swap.
4. Confirmed the PoolManager `Swap` event reported fee `700`.
5. Indexed the current hook fee and last applied swap fee in PostgreSQL.

---

## Network

| Field | Value |
|---|---|
| Network | BNB Smart Chain Testnet |
| Chain ID | `97` |
| Native token | `tBNB` |
| Wrapped native | `WBNB` |
| WBNB address | `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd` |

The preflight checks:

- RPC reachability.
- Chain ID.
- Wallet address and tBNB balance.
- WBNB runtime bytecode.
- A small WBNB wrap-and-unwrap proof.
- EIP-1153 transient-storage support.
- Current gas price.
- Estimated V4 deployment gas.
- Temporary liquidity requirements.
- Configured final wallet reserve.

The successful full-V4 run began with:

```text
0.427370158133660822 tBNB
```

The enforced combined minimum was:

```text
0.300000000000000000 tBNB
```

---

## Current validated deployment

These addresses belong to the fresh BSC Testnet run completed on 22 July 2026.

### Test assets

| Asset | Address | Decimals |
|---|---|---:|
| WBNB | `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd` | 18 |
| Test USD Coin (`tUSDC`) | `0x813fB80c189A5AD48f537706c266F375820AB551` | 6 |
| Test DEX Token (`tDEX`) | `0x61C01d869D84a55E0e94A419304Fdf2BabbD9fAA` | 18 |

### V2 contracts

| Contract | Address |
|---|---|
| V2 Factory | `0xe6e3521EB7836DF86AD35d27ea907eB727dB7acC` |
| V2 Router02 | `0x7408FF2F02A699281cC42E96990D8fb04945f04f` |

### V2 pairs

| Pair | Address | Final state |
|---|---|---|
| WBNB / tUSDC | `0x1729F84d75685609127614132C6E6D53b888e0a7` | Deployer LP removed; protocol minimum-liquidity dust remains |
| tUSDC / tDEX | `0x9dEebd9eEFf4B1Ac8382fB564Fb985bF1dF5DeEE` | Deployer LP removed; protocol minimum-liquidity dust remains |

### V3 contracts

| Contract | Address |
|---|---|
| V3 Factory | `0x2B67BA64476F9bbAaE766cF8869F0c718877aD44` |
| Multicall2 | `0xFB153b3F4260AeA7a3831FC80c54bEAFaCF0A736` |
| ProxyAdmin | `0xd00F9aE1d61B06deC9Ef12B6fC9185255dDC9d59` |
| TickLens | `0xDa4C8786b481557aA04c9981aF901379A91BBE32` |
| NFTDescriptor library | `0x1672aa092B299D85011FFcCdfdc7434055F9ea26` |
| Position descriptor implementation | `0xa533519189E20D7dE16EE202066a0793DeB7aE09` |
| Position descriptor proxy | `0x66100dB4dC2F7b55B67D4a937B17744D5AEe9C4A` |
| NonfungiblePositionManager | `0xdCa665F889909E60F042512bE6Ea63dA5E19271E` |
| V3Migrator | `0x74e18Ef0c9C4038efa2A99a2c042C97FB64606f7` |
| V3Staker | `0x267dAbb20aD82ab4f812F127f957Eb522753f543` |
| QuoterV2 | `0xd384490F929977a8b9aF4d73Cd92e23e38C90401` |
| SwapRouter02 | `0x0A77a4F3bE72D863d74919c40fACdf47b2944223` |

### V3 pools and positions

| Pool | Fee | Address | Position NFT | Final state |
|---|---:|---|---:|---|
| tDEX / WBNB | 0.30% | `0x5A4d111F39D61Ef67E30c0c7319561cD0c13D385` | `1` | Liquidity zero; NFT burned |
| tDEX / tUSDC | 0.05% | `0xA5B245f78D4EecC7A00c6D79F405ac6D3eF45Df3` | `2` | Liquidity zero; NFT burned |

### Shared routing contracts

| Contract | Address |
|---|---|
| Permit2 | `0xAEAdcEB97501Cd0d3a9149914Dc9B0d4491Fd694` |
| Universal Router v1.6.0 | `0x4527Df451c24d7d073166518c7a5601Cd722d8B7` |

### V4 contracts

| Contract | Address |
|---|---|
| PoolManager | `0xbf27C8273Fd07b6A14f536cc6d32989176F57352` |
| StateView | `0x03F93fFdA821CfA7915448c30eBda20B60084049` |
| V4Quoter | `0xAABb24f27913DdBdb30003FcF7391C25339cfc8f` |
| PositionDescriptor | `0x628FE5b005AA96268d5CA73dF940d42edfe75E59` |
| PositionManager | `0x42Fe6cBaf11EB4d48114b0CA88a7DB2a60637C9C` |
| HookFactory | `0x92951977D0a6B1E8eeB0068c74DfE87Aa680fa40` |
| ConfigurableDynamicFeeHook | `0xCc949F126EC57507Bdb6C8e42E565Fc13f9dC080` |
| Universal Router v2.1.0 | `0x38131b4E54748D376F6F588CF13F80c3d1b6A711` |

### V4 pools and positions

| Pool | Pool ID | Fee mode | Hook | NFT | Final state |
|---|---|---|---|---:|---|
| tUSDC / WBNB | `0x98935618719e957ded1557b70afdc382e312eae6f50fd530793da9809c1c1486` | Static `3000` / 0.30% | Zero address | `1` | Liquidity zero; NFT burned |
| tDEX / tUSDC | `0x5054b1ec9dc50007c5a60fe212da5f8aacceaa91c3bd76b3aeb40e2dfa944ea6` | Dynamic fee | `0xCc949F126EC57507Bdb6C8e42E565Fc13f9dC080` | `2` | Liquidity zero; NFT burned; indexed fee `700` |

V4 pools are not separate deployed contracts. Their state remains inside `PoolManager`.

---

## Validated liquidity profile

The fresh lifecycle temporarily created:

### V2

| Pair | Initial liquidity |
|---|---|
| WBNB / tUSDC | `0.01 WBNB` + `1,000 tUSDC` |
| tUSDC / tDEX | `1,000 tUSDC` + `1,000 tDEX` |

### V3

| Pool | Fee | Initial liquidity |
|---|---:|---|
| WBNB / tDEX | `3000` | `0.01 WBNB` + `1,000 tDEX` |
| tUSDC / tDEX | `500` | `1,000 tUSDC` + `1,000 tDEX` |

### V4

| Pool | Fee configuration | Initial maximum |
|---|---|---|
| WBNB / tUSDC | Static fee `3000`, tick spacing `60` | `0.002 WBNB` + `200 tUSDC` |
| tUSDC / tDEX | Dynamic fee, tick spacing `10` | `200 tUSDC` + `200 tDEX` |

Cleanup removed all liquidity controlled by the deployment wallet. V2 retains only its mandatory protocol minimum-liquidity dust.

---

## Validated swap execution

### Core routers

The lifecycle executed:

- Direct V2 swap through Router02.
- Direct V3 swap through SwapRouter02.
- V3 position increase, decrease, and collect.

### Universal Router v1.6.0

Validated command paths:

| Route | Result |
|---|---|
| Direct V2 | Passed |
| Direct V3 | Passed |
| V2 → V3 | Passed |
| Stranded router balances | `0` for tUSDC, tDEX, and WBNB |

### Universal Router v2.1.0 with V4

Validated command paths:

| Route | Commands | Result |
|---|---|---|
| Direct V4 dynamic-fee swap | `0x10` | Passed |
| V2 → V4 | `0x0810` | Passed |
| V4 → V3 | `0x1000` | Passed |
| Stranded router balances | — | `0` for tUSDC, tDEX, and WBNB |

The direct V4 smoke swap changed the hook fee from `500` to `700` and confirmed the emitted `PoolManager.Swap` event used fee `700`.

---

## Route API

The route API is exposed locally at:

```text
http://127.0.0.1:8088
```

Health:

```bash
curl -fsS http://127.0.0.1:8088/health | jq
```

Quote one `tUSDC` to `tDEX`:

```bash
curl -fsS \
  'http://127.0.0.1:8088/quote?tokenIn=TOKEN_A&tokenOut=TOKEN_B&amountIn=1' \
  | jq
```

The validated route comparison returned executable candidates for:

```text
V3
V2
V2 → V3
V4
V4 → V3
```

Build executable V4 calldata:

```bash
curl -fsS \
  'http://127.0.0.1:8088/build?tokenIn=TOKEN_A&tokenOut=TOKEN_B&amountIn=1&kind=v4' \
  | jq
```

An executable V4 build returns:

```text
executionMode: universal-router-v4
target: 0x38131b4E54748D376F6F588CF13F80c3d1b6A711
commands: 0x10
```

The route builder also reports required ERC-20 and Permit2 allowances.

---

## Runtime services

The runtime remains online after the test liquidity is removed.

| Service | Purpose | Port |
|---|---|---:|
| PostgreSQL 17 | Indexed chain and deployment state | Internal |
| V2/V3/V4 indexer | Reads events and updates PostgreSQL | Internal |
| Route API | Quotes and executable route building | `8088` |
| DEX monitor | RPC, database, indexer, and API health | `8090` |

Validated service state:

```text
postgres       healthy
v2-v3-indexer  healthy
route-api      healthy
dex-monitor    healthy
```

Monitor health:

```bash
curl -fsS http://127.0.0.1:8090/health | jq
```

Show containers:

```bash
docker compose --profile runtime ps
```

Show recent logs:

```bash
docker compose --profile runtime logs --tail=200
```

Start runtime services in stages:

```bash
scripts/start-runtime-staged.sh "$PWD"
```

Show runtime status:

```bash
scripts/runtime-status.sh
```

Stop runtime services:

```bash
scripts/runtime-stop.sh
```

---

## Indexed state

Before cleanup, PostgreSQL contained:

| Dataset | Count |
|---|---:|
| V2 pairs | 2 |
| V3 pools | 2 |
| V4 pools | 2 |
| V4 hooks | 1 |
| V4 positions | 2 |
| V3 positions | 2 |
| Indexed events | 51 |

After cleanup:

- Both V3 pools were indexed at liquidity `0`.
- Both V4 pools were indexed at liquidity `0`.
- Both V3 NFT owners were indexed as the zero address.
- Both V4 NFT owners were indexed as the zero address.
- The dynamic hook remained indexed.
- The dynamic pool’s final indexed fee was `700`.
- V2 reserves retained only minimum-liquidity dust.

---

## Complete lifecycle

The primary command is:

```bash
./run-full-fresh-test.sh
```

It performs:

```text
validate source and artifacts
→ delete previous local deployment state
→ reset PostgreSQL/runtime
→ build Docker image
→ synchronize owner configuration
→ combined V2/V3/V4 funding preflight
→ EIP-1153 transient-storage probe
→ WBNB wrap/unwrap proof
→ deploy V2 Factory and Router02
→ deploy V3 core and periphery
→ deploy tUSDC and tDEX
→ create V2 pairs
→ initialize V3 pools
→ mint V3 position NFTs
→ execute direct V2 and V3 swaps
→ test V3 increase/decrease/collect
→ deploy Permit2
→ deploy Universal Router v1.6.0
→ execute direct V2, direct V3, and V2→V3 routes
→ deploy V4 PoolManager and periphery
→ deploy HookFactory and dynamic-fee hook
→ deploy Universal Router v2.1.0
→ initialize static and dynamic V4 pools
→ mint V4 PositionManager NFTs
→ test V4 increase/decrease lifecycle
→ update the dynamic fee
→ execute direct V4, V2→V4, and V4→V3 routes
→ start PostgreSQL
→ start indexer and wait for first committed batch
→ start route API and wait for indexer catch-up
→ start health monitor
→ prove indexed route quoting
→ prove executable V4 calldata building
→ remove and burn V4 positions
→ remove V2 LP and V3 positions
→ unwrap recovered WBNB
→ wait for cleanup events to be indexed
→ verify final on-chain cleanup
→ verify final PostgreSQL state
→ leave runtime services healthy
```

---

## Installation

### Requirements

- Linux or WSL2
- Docker Engine
- Docker Compose
- Git
- Bash
- `curl`
- `jq`
- A dedicated BSC Testnet wallet
- At least `0.30 tBNB` for the validated full-V4 safety profile

A slightly higher balance is recommended to allow for gas-price movement.

### Clone

```bash
cd "$HOME"

git clone \
  https://github.com/CheyneWeb3/v2n3-and-UNI-deployable-V3-contracts.git

cd v2n3-and-UNI-deployable-V3-contracts
```

The existing validated WSL working path is:

```text
~/bsc-uniswap-v2-v3-stack
```

### Environment

```bash
cp .env.example .env

mkdir -p secrets
chmod 700 secrets

printf '%s\n' '0xYOUR_BSC_TESTNET_PRIVATE_KEY' \
  > secrets/deployer_private_key

chmod 600 \
  .env \
  secrets/deployer_private_key
```

Never commit:

```text
.env
secrets/deployer_private_key
deployments/97/
node_modules/
dist/
build/
```

Enable the complete system:

```bash
sed -i \
  's/^DEPLOY_V4_SYSTEM=.*/DEPLOY_V4_SYSTEM=1/' \
  .env
```

Validate without deploying:

```bash
./scripts/validate-release.sh "$PWD"

docker compose build dexctl
```

Run the V4 funding and compatibility preflight:

```bash
./dexctl preflight-v4
```

Run the complete lifecycle:

```bash
./run-full-fresh-test.sh
```

---

## Main commands

### Validation and status

```bash
./scripts/validate-release.sh "$PWD"
./dexctl preflight
./dexctl preflight-v4
./dexctl status
```

`./dexctl preflight` performs a small on-chain WBNB wrap/unwrap proof and therefore uses a small amount of gas.

### V2/V3 lifecycle

```bash
./dexctl deploy-all
./dexctl bootstrap
./dexctl smoke
./dexctl addons
./dexctl cleanup-liquidity
```

### V4 lifecycle

```bash
./dexctl deploy-v4
./dexctl bootstrap-v4
./dexctl smoke-v4
./dexctl cleanup-v4
```

### Runtime

```bash
scripts/start-runtime-staged.sh "$PWD"
scripts/runtime-status.sh
scripts/runtime-stop.sh
```

---

## Generated reports

Deployment-specific state is written under:

```text
deployments/97/
```

Important reports include:

```text
preflight-report.json
addresses.json
test-tokens-report.json
bootstrap-report.json
smoke-report.json
addons-report.json
v4-deployment-report.json
v4-bootstrap-report.json
v4-smoke-report.json
v4-cleanup-report.json
liquidity-cleanup-report.json
```

These files contain deployment addresses, transaction hashes, pool IDs, token IDs, block numbers, gas usage, quotes, received amounts, and cleanup evidence.

They are local generated state and are excluded from Git.

---

## Cleanup guarantees

The full runner does not stop after proving swaps. It removes its test liquidity and verifies the result.

### V2

- Removes every LP token owned by the deployer.
- Confirms deployer LP balances are zero.
- Leaves only protocol-mandated minimum-liquidity dust.

### V3

- Decreases all remaining position liquidity.
- Collects the position assets and fees.
- Burns both empty NFT positions.
- Confirms indexed pool liquidity is zero.
- Confirms indexed NFT owners are the zero address.

### V4

- Removes all remaining PositionManager liquidity.
- Takes both pool currencies.
- Burns both V4 position NFTs.
- Confirms PoolManager liquidity is zero for both configured pools.
- Confirms indexed NFT owners are the zero address.
- Preserves hook metadata and final fee history.

### WBNB

Only WBNB recovered by cleanup is unwrapped. Pre-existing wallet WBNB is not swept.

---

## Security properties

- The deployment private key is never copied into the Docker image.
- The private key is read from a local bind-mounted file.
- `.env` and generated deployment state are excluded from Git.
- The chain ID and deployment wallet are checked before deployment.
- V4 deployment is refused when the wallet does not meet the combined safety budget.
- EIP-1153 support is checked before deploying the V4 singleton.
- The hook is deployed through a controller-locked CREATE2 factory.
- Permit2 and router approvals are reported.
- Router balances are checked for stranded tokens after swaps.
- Cleanup is checked both on-chain and through PostgreSQL.
- Every lifecycle stage is fail-fast.

---

## Explorer verification status

Automated BscScan/Etherscan source verification is intentionally **not included** in v0.6.3.

The repeatedly failing verification-catalog subsystem was removed so it cannot block or destabilize the tested exchange lifecycle. This does not affect:

- Contract deployment.
- Pool creation.
- Swaps.
- Permit2.
- Universal Routers.
- V3 or V4 positions.
- Hooks.
- Indexing.
- Route building.
- Monitoring.
- Liquidity cleanup.

Contract source publication can be implemented later as a separate release and should not be treated as part of the validated v0.6.3 acceptance result.

---

## Repository layout

```text
.
├── config/
│   └── chains/
├── contracts/
│   ├── ConfigurableDynamicFeeHook.sol
│   ├── HookFactory.sol
│   └── TestERC20.sol
├── deployments/
├── precompiled/
│   ├── Permit2.json
│   └── UniversalRouter.json
├── scripts/
├── secrets/
├── src/
│   ├── commands/
│   ├── lib/
│   └── runtime/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── dexctl
├── package.json
└── run-full-fresh-test.sh
```

---

## Upstream packages

The stack uses official Uniswap packages and deployment sources including:

```text
@uniswap/v2-core@1.0.1
@uniswap/v2-periphery@1.1.0-beta.0
Uniswap deploy-v3 v1.0.3
Permit2
Universal Router v1.6.0
@uniswap/v4-core@1.0.2
@uniswap/v4-periphery@1.0.3
@uniswap/universal-router@2.1.0
```

Review:

```text
UPSTREAM-SOURCES.json
LICENSES.md
```

before redistribution or production use.

---

## Network and production warning

This release is configured and validated for **BNB Smart Chain Testnet only**.

Do not use mainnet funds or a production private key without:

- A separate mainnet configuration.
- Independent contract and dependency review.
- Source verification work performed separately.
- Contract ownership and upgrade-policy review.
- Production RPC infrastructure.
- Treasury and key-management controls.
- Monitoring and incident procedures.
- Fresh deployment and liquidity rehearsal using controlled value.

---

## Final validated result

```text
PASS: FRESH V2/V3/V4 DEPLOY -> TEST -> INDEX -> ALL CONFIGURED LIQUIDITY REMOVED
```

At completion:

```text
All deployer-owned V2 LP tokens were removed.
Uniswap V2 retained only protocol minimum-liquidity dust.
All V3 liquidity was collected and both position NFTs were burned.
All V4 PositionManager liquidity was removed and both NFTs were burned.
The dynamic-fee hook remained indexed with fee 700.
Both V3 pools and both V4 pools were indexed at zero liquidity.
PostgreSQL, indexer, route API, and monitor remained healthy.
```
