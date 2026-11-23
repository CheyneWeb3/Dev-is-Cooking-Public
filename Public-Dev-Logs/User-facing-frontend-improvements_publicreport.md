# Dev is Cooking — Frontend Development Report

**Date:** 22 November 2026  
**Development Releases:** R1–R20  
**Current Frontend Baseline:** R20  
**Scope:** User-facing frontend improvements

## 1. Overview

The Dev is Cooking frontend has undergone a series of targeted improvements to simplify navigation, improve usability, reduce interface clutter, enhance market information and correct display and charting issues.

Development has been based on the existing live frontend source, preserving the application's architecture and working functionality.

The updates focus on improving existing components rather than rebuilding the application.

**The individual Strategy Controls and Details page has remained completely unchanged throughout development.**

---

## 2. Cooking Navigation and Strategies Overview

### Cooking Navigation

The Cooking section has been simplified to provide two primary options:

- **Strategies**
- **Create**

Redundant Rules, Activity, Library and Markets links have been removed from the main Cooking interface.

### Strategies Overview

| Feature | Improvement |
|---|---|
| Default display | Table view |
| Alternative display | Optional Card view |
| Smaller screens | Automatically uses Cards at 980px and below |
| Table columns | Removed Mode and Updated |
| Card information | Removed Mode |
| Token identification | Added token-pair logos |
| Table logo positioning | Left of strategy name |
| Card logo positioning | Top-left beside strategy name |
| Available actions | Open and Delete icons only |
| Removed overview actions | Start, Rerun, Pause and Export |
| Table interaction | Clicking a row opens strategy details |
| Card interaction | Clicking a card opens strategy details |
| Delete interaction | Existing confirmation behaviour retained |
| Navigation tabs | Removed redundant Strategies/Create tabs |

### Protected Strategy Management

The existing individual Strategy Controls and Details page has been preserved without modification.

All existing strategy execution controls, management actions, configuration options and functionality remain unchanged.

---

## 3. Markets Improvements

The Markets section has been simplified into a cleaner token-market interface.

### Display Improvements

- Simplified page heading to **Markets**.
- Removed unnecessary subtitles and header elements.
- Removed duplicate Cooking navigation tabs.
- Retained the token search bar.
- Added token logos alongside token symbols and names.
- Added additional token-logo resolution sources.
- Replaced shortened mint-address displays with token identification details where metadata is available.

### Markets Table

| Column | Information |
|---|---|
| Token | Logo, symbol and name |
| Price | Displayed market price |
| 24H | 24-hour price movement |
| Liquidity | Reported liquidity |

The Freshness, Rules and Actions columns have been removed.

### Token Filtering

A minimum liquidity requirement has been added.

**Tokens must have at least $10,000 USD in reported liquidity to appear in Markets.**

Tokens below the threshold or without valid liquidity information are hidden from the displayed list.

### Token Navigation

Selecting a token from Markets opens its existing Asset Details page.

This reuses the application's existing token-details functionality rather than introducing a duplicate screen.

---

## 4. Activity Improvements

The Activity section has been updated to provide a cleaner and more compact transaction and execution history.

### Interface Changes

- Simplified the heading to **Activity**.
- Removed the descriptive subtitle.
- Removed redundant Cooking navigation tabs.
- Collapsed existing filter controls behind a compact filter icon.
- Preserved the available filtering functionality.
- Removed queued items from the displayed activity list.
- Removed the Queued filter option.

### Collapsible Activity Entries

Activity records now appear as compact rows by default.

Each collapsed row displays relevant summary information, including activity status, summary, date/time and a transaction link when available.

Expanding a row reveals the existing detailed information, including strategy, rule, observed price, reason and execution-job information where available.

### Transaction Links

Transaction records containing valid Solana transaction signatures include direct explorer links.

Queued records are hidden from the user interface rather than deleted from stored activity history.

---

## 5. Assets and Wallet Interface

The Assets page has been simplified by removing unnecessary headings and placing important information at the top.

Changes include:

- Removed the Wallet section heading.
- Removed the Assets page title.
- Removed the descriptive subtitle.
- Positioned the Total Value summary as the first main content block.
- Moved Refresh to the bottom of the held-token list.
- Applied Refresh placement to desktop and mobile layouts.

Existing wallet balances, asset holdings, token listings and wallet functions remain intact.

---

## 6. Asset Details and GeckoTerminal Charts

Several corrections have been made to the Asset Details charting interface.

### Chart Persistence

An issue caused GeckoTerminal charts to disappear shortly after successfully loading.

The frontend was automatically removing the embedded chart after a fixed timeout.

The forced timeout was removed, allowing the existing GeckoTerminal iframe to remain mounted.

### Stablecoin Chart Selection

The USDC and USDT charts were sometimes displaying unrelated trading-pair prices.

Chart selection was updated to:

- Identify the correct USDC and USDT token mints.
- Select appropriate stablecoin pricing pools.
- Avoid unrelated high-liquidity trading pairs.
- Display the selected stablecoin's USD price.
- Preserve existing chart selection for other tokens.

### Stablecoin Displayed Prices

A separate issue caused incorrect stablecoin prices to appear in the Asset Details header.

The displayed price resolution was updated to use the selected verified stablecoin pricing source.

The changes also address base/quote token conversion and prevent unreliable fallback prices from temporarily appearing.

When suitable stablecoin price data is unavailable, the interface displays an unavailable value rather than a potentially incorrect market price.

---

## 7. Profile and Application Preferences

### Profile Navigation

The existing Settings section has been renamed to **Profile**.

This provides a dedicated location for account information, user preferences and application settings.

### Advanced Mode

An Advanced Mode ON/OFF toggle has been added to Profile preferences.

The control is visual-only in this release and does not alter existing trading functionality or backend permissions.

### Network Selection

The Mainnet/Devnet selector has been removed from the application's desktop and mobile headers.

The existing selector has been relocated to:

**Profile → Preferences**

Its original network-switching functionality has been preserved.

---

## 8. DCA Interface

The DCA page has received a targeted navigation cleanup.

The obsolete **Cooking Rules** link button has been removed because it does not correspond to the updated user-facing navigation.

The Create DCA functionality, existing configuration, scheduling controls and execution behaviour remain unchanged.

---

## 9. Frontend Release History

| Release | Main Development Change |
|---|---|
| R1 | Cooking navigation, Strategies overview, Profile and Advanced Mode |
| R2 | Markets table improvements |
| R3 | Token logo lookup improvements |
| R4 | Markets header simplification |
| R5 | Token-details navigation |
| R6 | Minimum $10,000 liquidity filtering |
| R7 | Activity interface and collapsed filters |
| R8 | Strategy Open/Delete actions |
| R9 | Responsive strategy overview and column simplification |
| R10 | Strategy token-pair logos |
| R11 | Clickable strategy tables and cards |
| R12 | Collapsible Activity entries and transaction links |
| R13 | Removed duplicate Strategies overview navigation |
| R14 | Persistent GeckoTerminal charts |
| R15 | Stablecoin chart-pair corrections |
| R16 | Stablecoin price-display corrections |
| R17 | DCA navigation cleanup |
| R18 | Assets overview and Refresh placement |
| R19 | Network selection moved to Profile |
| R20 | Consolidated frontend release |

---

## 10. Build and Validation

### Development Validation

The frontend updates have been packaged into incremental, versioned releases.

Validation performed during development included:

- TypeScript and TSX source syntax checks.
- CSS parsing checks.
- ZIP archive integrity verification.
- Comparison of protected source files.
- Focused feature checks for relevant changes.
- Preservation checks against previous releases.

### Production Build

The initial production build encountered a dependency installation error.

After clearing the build cache, the subsequent build successfully completed:

| Build Stage | Result |
|---|---|
| Dependency installation | PASS |
| TypeScript compilation | PASS |
| Vite production build | PASS |
| Module transformation | PASS |
| Production asset generation | PASS |
| Deployment | PASS |

The confirmed production build transformed **3,317 modules** successfully.

A non-blocking warning concerning large JavaScript bundles was reported.

The successful production build confirms the source revision built at that point in development. The later R14–R20 releases have been packaged and source-checked but do not have an independently confirmed full production build in this report.

### Protected Components

Across the frontend update releases, the individual Strategy Controls and Details page has remained unchanged.

No backend, trading-worker, custody-signer or RPC configuration changes were performed as part of this frontend development work.

---

## 11. Development Summary

**Frontend Baseline:** R20  
**Development Releases:** R1–R20  
**Production Build:** Successful for a previously deployed revision  
**Backend Modifications:** None performed  
**Strategy Controls and Details Page:** Unchanged  

The Dev is Cooking frontend has received substantial user-facing improvements across navigation, strategy discovery, Markets, Activity, Assets, Profile preferences and GeckoTerminal charting.

The changes provide a cleaner interface, more direct navigation, improved token identification, compact activity monitoring and more reliable chart presentation.

Development has followed an incremental, targeted approach, preserving the application's established trading functionality and underlying architecture.

**The R20 frontend represents the consolidated development release from this update series.**
