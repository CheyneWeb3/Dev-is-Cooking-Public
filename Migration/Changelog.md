# Migrate Tokens Frontend Changelog

This changelog records frontend updates made to the Migrate Tokens app.

The frontend supports Telegram account verification, BSC/EVM wallet connection, Solana wallet connection, token deposit handling, migration address confirmation, deposit status tracking, and public migration totals.

---

## 2026-06-23 — Accounts Tab, Deposit Modal, and Solana Wallet Handling

### Added

* Added **Accounts** as its own bottom navigation section.
* Added Accounts to the same navigation flow as Register, BSC, Solana, Status, and Totals.
* Added account and wallet controls inside the Accounts section.
* Added deposit processing modal for BSC/MOON deposits.
* Added deposit processing modal for Solana/SVM deposits.
* Added close button to the processing modal.
* Added automatic modal close after successful deposit submission.

### Changed

* Moved account and wallet information out of the main page content.
* Removed the large account/wallet area from displaying across the main app screens.
* Kept Telegram session status, linked wallet status, connected wallets, and migration address status inside Accounts.
* Kept Telegram session restore running in the background.
* Kept wallet auto-linking running in the background.
* Updated deposit screens so processing feedback appears after a deposit action is started.

### Fixed

* Fixed Solana balance detection for wallet variants that do not expose balances the same way as standard browser wallets.
* Fixed Solana token balance reading so the frontend can detect token balances across owned Solana token accounts.
* Fixed cases where a Solana wallet could show a token balance in the wallet app while the migration frontend showed zero.
* Updated Solana deposit source handling so deposits are not limited to one expected token account structure.
* Improved Reown/AppKit Solana address handling for WalletConnect-based Solana wallets.

### Notes

* This update keeps the existing bottom navigation structure.
* The Accounts section is now the location for wallet and account management.
* The Solana wallet changes are frontend-side compatibility updates.
* Backend confirmation remains the source of truth for final deposit status.

---

## 2026-06-02 — Core Frontend Build

### Added

* Added Vite React frontend for the migration app.
* Added Material UI layout and component styling.
* Added Reown AppKit wallet connection support.
* Added BSC/EVM wallet connection support.
* Added Solana wallet connection support.
* Added Telegram session handling.
* Added migration account registration flow.
* Added BSC/MOON deposit page.
* Added Solana/SVM deposit page.
* Added user status page.
* Added public totals page.
* Added final migration address confirmation.

### Changed

* Limited deposit screens to supported migration tokens only.
* Removed arbitrary token input from deposit flow.
* Set Telegram as the main account verification method.
* Set EVM/BSC address as the final migration/claim address.

### Notes

* Supported chains: BSC/EVM and Solana.
* Supported frontend wallet system: Reown AppKit.
* Supported migration flow: Telegram verification, wallet connection, wallet linking, deposit, status tracking.

---

## Registration and Account Flow Updates

### Added

* Added registration screen as the main onboarding area.
* Added Telegram verification status display.
* Added connected wallet status display.
* Added linked wallet status display.
* Added migration address status display.
* Added handling for already-linked accounts.
* Added handling for already-set migration addresses.

### Changed

* Removed the separate Claim tab from the main flow.
* Registration now requires Telegram verification and linked wallet status.
* BSC/EVM wallet can be used as the final migration address.
* Solana wallet can be linked for Solana/SVM deposits.
* Existing migration address is shown when already set.
* Connected wallet can pre-fill the migration address field when available.

### Fixed

* Fixed account status flicker during background checks.
* Fixed repeated account refresh loops.
* Fixed temporary session-check misses clearing visible account state.
* Fixed connected wallet state being displayed as unlinked during background refresh.
* Fixed unnecessary screen switching during wallet/account checks.

---

## Telegram Linking Updates

### Added

* Added support for Telegram-opened app links.
* Added Telegram session restore from app open code.
* Added automatic wallet linking after Telegram session is active.
* Added Telegram account status display in the frontend.
* Added Telegram bot open-link handling.

### Changed

* Telegram is used as the primary migration account identity.
* Wallets are linked under the Telegram-backed account.
* Registration state is based on Telegram session, linked wallets, and migration address status.
* Telegram open button now routes users back through the bot flow.

### Fixed

* Fixed cases where a linked wallet could appear unregistered when the browser session was missing.
* Fixed repeated prompts for users who had already registered through Telegram.
* Fixed wallet/account recheck handling when reopening the app outside the original Telegram session.

---

## Wallet Connection Updates

### Added

* Added wallet selection flow for BSC/EVM and Solana.
* Added separate connection handling for BSC/EVM wallets.
* Added separate connection handling for Solana wallets.
* Added connect action directly on deposit pages when the required wallet is not connected.

### Changed

* Main connect action no longer assumes only one wallet type.
* BSC deposit page prompts for BSC/EVM wallet connection when needed.
* Solana deposit page prompts for Solana wallet connection when needed.
* Connected wallets are managed through the account/wallet area instead of being repeated across every screen.

### Fixed

* Fixed unclear wallet connection states between BSC/EVM and Solana.
* Fixed deposit pages showing action buttons before the required wallet type was connected.
* Fixed wallet connection flow for users entering from mobile wallet browsers.

---

## BSC Deposit Updates

### Added

* Added MOON balance reading for connected BSC/EVM wallet.
* Added Max button support for BSC/MOON deposits.
* Added transaction hash handling after wallet confirmation.
* Added retry handling for transaction hash submission.
* Added BscScan transaction link display.
* Added cancelled-intent cleanup for cancelled wallet actions.

### Changed

* BSC transaction hash is submitted to the backend as soon as the wallet returns it.
* Backend status tracking no longer depends on the browser waiting for full transaction confirmation.
* BSC deposit flow stores pending transaction submission data locally until backend submission succeeds.
* Wallet confirmation and backend deposit tracking are handled as separate steps.

### Fixed

* Fixed cases where a real BSC transaction could be broadcast but not submitted to the backend.
* Fixed browser interruption causing a transaction to stay as an intent only.
* Fixed cancelled wallet confirmations leaving unnecessary pending deposit records.
* Fixed incomplete deposit attempts being repeatedly scanned.

---

## Solana Deposit Updates

### Added

* Added SVM balance reading for connected Solana wallet.
* Added Max button support for Solana/SVM deposits.
* Added Solana signature submission after wallet transaction broadcast.
* Added cancelled-intent cleanup for cancelled Solana actions.
* Added support for Solana wallet variants through broader token account balance reading.

### Changed

* Solana transaction signature is submitted to the backend after transaction broadcast.
* Frontend no longer relies only on browser-side transaction confirmation before backend submission.
* Solana balance reading now checks owned token accounts instead of relying only on one expected associated token account.
* Solana deposit source handling now supports token balances held across owned token accounts.

### Fixed

* Fixed Solana deposits being missed when browser-side confirmation failed after broadcast.
* Fixed token balance detection for wallets that aggregate token balances differently.
* Fixed cases where Solana wallet balance appeared in the wallet app but not in the frontend.
* Fixed Solana deposit source assumptions that worked for some wallets but not all wallet variants.

---

## Snapshot and Allowance Updates

### Added

* Added snapshot allowance display.
* Added remaining allowance display.
* Added already reserved/deposited amount display.
* Added deposit limit checks before wallet transaction request.
* Added Max button behaviour based on wallet balance and remaining allowance.

### Changed

* Deposit amount validation now considers the remaining eligible allowance.
* Deposit pages show the amount available before a transaction is started.
* Frontend blocks deposits above the available allowance before wallet confirmation.

### Fixed

* Fixed cases where users could try to submit more than their remaining allowance.
* Fixed Max button using wallet balance without considering migration allowance.
* Fixed unclear deposit availability display.

---

## Status and Deposit Tracking Updates

### Added

* Added deposited-token balances table.
* Added source wallet display for deposits.
* Added support for multiple source wallets depositing the same supported token.
* Added status display grouped by wallet and token.

### Changed

* Deposit rows are grouped by chain, token, and source wallet.
* Status table now shows deposits from separate wallets as separate rows.
* Token display was shortened for the supported migration token flow.
* Wallet display was shortened for table readability.

### Fixed

* Fixed multiple deposits from different wallets collapsing into a single token row.
* Fixed source wallet information being unclear in the status table.
* Fixed table spacing issues on mobile screens.

---

## Mobile Layout Updates

### Added

* Added mobile-first dark layout.
* Added fixed bottom navigation.
* Added compact screen sections.
* Added responsive cards and tables.
* Added better chip wrapping and spacing.

### Changed

* Header layout was reduced.
* Account/wallet information was moved away from repeated header display.
* Status cards replaced cramped chip groups in several areas.
* Tables were adjusted for smaller screens.
* Main screens were spaced for mobile and wallet-browser use.

### Fixed

* Fixed wrapped chips touching or overlapping.
* Fixed cramped mobile status layouts.
* Fixed deposit/status card spacing on small screens.
* Fixed account information taking too much space across app screens.

---

## Public Totals Updates

### Added

* Added public migration totals display.
* Added clearer totals card layout.
* Added deposited balance visibility for public progress tracking.

### Changed

* Public totals were separated from user account status.
* Totals display was adjusted for mobile layout.

---

## Current Frontend State

The current frontend includes:

* Telegram account verification
* Telegram session restore
* BSC/EVM wallet connection
* Solana wallet connection
* Wallet linking to a migration account
* Final migration address confirmation
* BSC/MOON deposit flow
* Solana/SVM deposit flow
* Snapshot allowance display
* Deposit limit handling
* Deposit processing modal
* User deposit status tracking
* Source wallet based deposit display
* Public migration totals
* Accounts tab for wallet and account management
* Mobile-first layout
* Reown/AppKit wallet handling
* Solana wallet variant compatibility updates

---

## Public Notes

* This changelog covers frontend changes only.
* No backend secrets, server details, private keys, environment variables, or internal access details are included.
* Backend confirmation remains the final source of truth for deposit status.
* Wallet connection does not give the app custody of user private keys.
