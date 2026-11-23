# DEVIS COOKING
## Weekly Development, Security & Platform Modernisation Report
**Reporting period:** 16–22 November 2026  
**Additional coverage:** Frontend and consolidation work continuing 23 November 2026  
**Primary focus:** Security remediation, repeat vulnerability audits, infrastructure consolidation, independent disaster recovery and frontend improvements.

### Executive Summary

This reporting period delivered important improvements across Devis Cooking's security, infrastructure reliability, disaster recovery capabilities and user interface.

Following the previous week's security investigations, attention shifted towards applying identified protections, independently rechecking server security, repairing legacy functionality and developing a consolidated deployment architecture.

A significant milestone was the transition towards restoring and validating Devis Cooking on an entirely separate system, independent of the production server.

Frontend development also progressed substantially, with improvements to navigation, strategy management views, wallet presentation and mobile usability while protecting existing trading functionality.

### 1. Security Remediation and Repeat Vulnerability Auditing

Security remained a priority throughout the week, with additional checks performed in response to emerging exploit concerns.

**NGINX security upgrade**

The website container was identified as using NGINX 1.27.5. A controlled website-only rebuild and deployment upgraded it to **NGINX 1.30.7**.

Following deployment, the website was successfully revalidated for:

- Website availability and HTTP responses.
- Existing configuration and content integrity.
- Cloudflare Tunnel connectivity.
- Container isolation and read-only filesystem protections.
- Preservation of rollback images and deployment configuration.
- No interruptions to unrelated trading or backend services.

**Security investigation and incident rechecks**

A subsequent investigation examined suspicious HTTP requests targeting sensitive paths, including `.env`, `.git` and common WordPress locations.

These requests were reviewed alongside filesystem integrity, container processes, application errors and website configuration.

The repeated checks found no evidence of successful access to sensitive configuration content or observable compromise in the inspected system state. HTTP 200 responses to sensitive-path probes were verified as returning the normal website page rather than the requested private files.

Additional protections were reconfirmed:

- Direct root SSH login disabled.
- Password-based and keyboard-interactive SSH authentication disabled.
- Public-key authentication enabled.
- Website container running without privileged permissions.
- Read-only website filesystem and no Docker socket exposure.
- Website traffic routed through the existing localhost-bound service and Cloudflare Tunnel.
- Private database connectivity and isolated service networking.

**Java4Shell vulnerability exposure check**

A separate assessment checked the newly discussed Java4Shell threat against the server environment.

The audit found no running Java processes and no installed host Java runtime. The relevant CPU instruction capabilities were also checked.

The result indicated no identified exposure through the inspected host Java environment.

These repeated reviews strengthened confidence in the current infrastructure while providing a more detailed understanding of attempted automated probing and potential exposure paths.

### 2. Dust Buster Repair and Backend Compatibility

The Dust Buster module required attention after intermittent HTTP 500 and 503 errors affected its preview functionality.

The investigation established that the module had been developed before several major backend changes, including the isolated custody signer, RPC failover improvements and worker updates.

The repair focused on compatibility with the **current live Devis Cooking architecture**, rather than replacing the working backend with an older consolidated candidate.

Work included:

- Reviewing legacy Solana RPC usage and integrating the existing public RPC pool/failover approach.
- Validating interactions with the R4 isolated custody signer.
- Preserving Jupiter integration, fee handling and existing transaction execution boundaries.
- Deploying the updated Dust Buster API image independently of the signer and worker services.
- Testing connected-wallet and Strategy Vault functionality.

The initial post-deployment tests successfully exercised connected and strategy-wallet previews, identifying 12 token accounts across swap-and-close and close-only operations.

A later recurrence of HTTP 503 responses was identified for continued reliability investigation.

The work preserved the existing security architecture and free/public RPC policy.

### 3. Infrastructure Consolidation and Deployment Management

Development progressed towards consolidating Devis Cooking's separate Docker services, configuration files and deployment dependencies into a more manageable, repeatable platform architecture.

The work encompassed the trading backend, main Cooking services, payment infrastructure and website components.

Key areas included:

- Consolidating service definitions and deployment dependencies.
- Validating image identities and existing runtime configurations.
- Preserving private environment files and sensitive secret mounts.
- Verifying networking, service startup requirements and persistent storage paths.
- Establishing controlled image locks, rollback boundaries and recovery procedures.
- Preparing centralised DockerStacked management for supporting service components.

During the reporting period, the production service inventory was rechecked, with **30 running containers** across the trading, core, payment and website stacks.

The objective of consolidation is to reduce deployment complexity, improve recovery reliability and maintain strict separation of sensitive signing responsibilities.

**Status:** Consolidation progressing through isolated validation, source alignment and deployment architecture preparation.

### 4. Independent Backup, Restore and Disaster Recovery

One of the week's most significant achievements was establishing a recovery workflow capable of reconstructing Devis Cooking on a completely separate system.

Rather than relying solely on backups stored on the production Linode server, we transitioned into a dedicated **Cooking-Test environment running under Windows WSL with Docker**.

The recovery preparation included:

- Encrypted backup archives covering application source and database data.
- MongoDB, PostgreSQL and separate trading/core Redis datasets.
- Exported Docker images and configuration dependencies.
- SHA-256 integrity and archive verification.
- Independent decryption and archive integrity checks.
- Preparation of a consolidated replacement-host recovery layout.

**Independent recovery testing**

The Cooking-Test environment successfully restored and validated:

- **21 Docker images** available locally for recovery.
- MongoDB database restoration.
- PostgreSQL database restoration.
- Two independent Redis data restorations.
- A dedicated internal Docker network named `cooking-test-private`.
- Database connectivity and isolated service communication.
- Compose configuration validation across four application projects.

Application-level validation also began, including website startup checks, API dependency inspection and testing of isolated runtime configuration.

This established a practical foundation for recovering Devis Cooking without depending on the original production host.

**Status:** Independent restore verification achieved for core database and image recovery; full application startup, environment alignment and recovery acceptance testing progressing.

### 5. Continued Security Isolation and Production Protection

The recovery and consolidation work was carried out with strict safeguards to avoid damaging or accidentally modifying the live platform.

The separate environment was structured to prevent unintended connections to production services and avoid accidental execution of trading, signing or payment operations.

Additional security validations covered:

- Isolated signer secret permissions and service access boundaries.
- Database container networking and private communication.
- Runtime environment and deployment parity.
- Service health and dependency configuration.
- Preservation of production wallet, database and trading state.

The recovery exercises were intentionally separated from the live environment, allowing continued testing without interfering with existing users or active operations.

### 6. Frontend Development and User Experience Modernisation

Frontend improvements progressed during 21–22 November, with additional design and consolidation work continuing on 23 November.

The focus was to improve usability, navigation and presentation while preserving established strategy execution behaviour.

**Navigation and dashboard improvements**

Work covered cleaner Cooking navigation, more consistent page layouts and improved access to major application sections.

Related interface changes included refinements to Markets, Activity, Assets and Profile, along with improved token presentation, liquidity filtering and clearer financial displays.

**Strategy management improvements**

The Strategies overview was developed to support a more flexible listing experience, including:

- Default table view with an optional card layout.
- Clear presentation of strategy status, trading mode, wallet association and active rules.
- Improved action visibility and responsive mobile layouts.
- Sorting and more consistent strategy management entry points.

A critical requirement was that the **existing individual Strategy Details and Controls page remain unchanged**, preserving its current actions, management behaviour and trading functionality.

**Wallet presentation and usability**

User-facing wallet terminology was refined, including the introduction of **Strategy Vault** naming for the platform-managed strategy wallet and clearer Connect Wallet presentation for external wallet connections.

Supporting work also addressed wallet popup layouts, Profile presentation, Advanced Mode visibility and mobile-friendly interactions.

**Design consistency**

The modernisation retained the established Devis Cooking branding, using dark backgrounds and purple, violet, magenta and amber accents.

The intended result is a cleaner, more consistent and more accessible interface without requiring users to relearn existing trading controls.

### 7. Preparation for Future User Entitlements

The frontend planning also considered future distinctions between Regular and Premium users.

The architecture direction allows for configurable entitlements, including potential limits on strategy counts, additional Strategy Vault creation and selected future capabilities.

This work remains preparatory and dormant, preserving current default access and wallet behaviour.

The immediate focus remains security, usability and reliable operation, rather than introducing subscriptions or billing functionality.

### 8. Development Validation and Release Protection

Frontend and consolidation changes were accompanied by source-level checks, component validation and deployment safeguards.

The work included targeted TypeScript/TSX and CSS validation, frontend build checks, source discovery and Git baseline verification.

Further work on 23 November introduced an isolated consolidation branch and additional DockerStacked integration preparation, maintaining separation from the production deployment.

Continued work is focused on production build validation, authenticated interface testing, recovery acceptance and ensuring the consolidated deployment can reproduce existing functionality without regressions.

### Weekly Outcome

The week demonstrated measurable progress in Devis Cooking's security, reliability, recoverability and frontend usability.

The most important achievements were the NGINX security upgrade and subsequent rechecks, the initial Dust Buster repair, successful independent restoration of core database systems, verification of 21 recovery images, and substantial frontend improvements.

The continuing consolidation and recovery programme is positioning Devis Cooking for more reliable deployment, safer maintenance and improved disaster recovery.

Together, these developments move the platform towards a more secure, maintainable and user-friendly production environment while retaining the integrity of its existing trading and custody systems.
