# DEVIS COOKING
## Weekly Development & Security Report
**Reporting period:** 8–15 November 2026  
**Primary focus:** Security hardening, vulnerability investigations, authentication architecture and platform protection.

### Executive Summary

This reporting period concentrated on strengthening Devis Cooking's security posture following heightened concerns about recently disclosed internet vulnerabilities, widespread exploitation attempts and the risk of unauthorised access to online infrastructure.

The priority was to review the existing platform, identify potential exposure points, reinforce established security protections and design an additional authentication layer for users accessing Devis Cooking.

Alongside these investigations, we continued validating the consolidated backend architecture, preserving production stability and checking the integrity of recovery assets.

### 1. Security Auditing and Vulnerability Hardening

A series of infrastructure and application-level reviews examined the potential attack surface of the Devis Cooking platform.

Key work included:

- **Infrastructure isolation:** Revalidated the separation of application containers, database services and internal networking, including checks that MongoDB was not directly published to the internet.
- **Custody security:** Reconfirmed the existing keyless custody architecture, where sensitive signing operations remain isolated from general API and worker processes. Restricted access to signing material and read-only secret handling remained central safeguards.
- **Container security:** Inspected Docker service definitions, environment handling, mounted storage, permissions and production configuration consistency.
- **Application exposure:** Reviewed frontend integrations, wallet connectivity and externally supplied metadata as potential routes for unsafe browser requests.
- **Configuration protection:** Checked the consolidation process for unintended changes to secrets, credentials, signing boundaries and active production configuration.

The work was preventative, driven by concerns about internet-wide attacks rather than evidence that Devis Cooking itself had been successfully compromised.

### 2. External Token Metadata and Browser Security

During 13–14 November, investigations identified a potentially problematic aspect of how token logos were obtained and displayed.

The audit traced token image URLs through Jupiter's metadata service into the Cooking frontend. Some images originated from external IPFS gateways and other third-party hosts, including a token icon hosted at a URL flagged by Malwarebytes.

The investigation confirmed that a token being marked as verified did not necessarily establish that its external image source was safe.

A read-only inventory of external image hosts and alternative image delivery sources was performed successfully.

This provided the basis for tighter image-source validation, trusted-host handling and future protection against unsafe externally supplied content.

### 3. Telegram Authentication and PIN Security Design

Work progressed on a centralised **Account Security and PIN framework** covering the web application and Telegram Mini App.

The agreed design introduced the following principles:

- User-selected **4–6 digit security PIN**.
- Automatic account lock after inactivity, defaulting to **15 minutes**, adjustable between **5 and 20 minutes**.
- PIN requirements for Telegram account unlocking and sensitive account or strategy actions.
- Central backend enforcement rather than relying solely on frontend restrictions.
- Trusted-device recognition, session revocation and stronger verification for new or higher-risk access.
- Administrative options for forced logout, account locking and security intervention.

The design preserves existing wallet-signing requirements and allows already-authorised automated strategies to continue operating independently of an inactive user session.

The objective is to provide consistent security across supported login methods without disrupting the underlying trading architecture.

**Status:** Authentication and PIN architecture designed, with implementation planning progressing through the central Account Security framework.

### 4. Wallet Authentication and Integration Review

Additional work examined wallet connection handling, authentication timeouts and the Reown/Trust Wallet integration.

The review included version compatibility, Solana-specific wallet configuration and behaviour when sessions expire.

The intended improvements include directing expired sessions back to authentication automatically, reducing stale-session exposure and maintaining clear separation between wallet identity and authorisation for sensitive account actions.

### 5. Backend Consolidation and Recovery Protection

Security work was accompanied by controlled validation of the backend consolidation candidate.

The technical reviews verified:

- **12 service roles and 16-container topology** represented in the consolidation candidate.
- Inventory of eight application images and supporting build configurations.
- Compose service rendering and environment parity against the existing architecture.
- Source integrity checks, including previously identified application files.
- Recovery archives, Docker image exports and matching SHA-256 checksums for transferred backup material.
- Preservation of existing production containers, databases, Git state and live signing infrastructure during offline validation.

The consolidation approach emphasised reliable rollback, protection of sensitive credentials and reducing configuration duplication before further platform restructuring.

### Weekly Outcome

The week established a stronger security baseline and a defined direction for account authentication improvements.

Security-sensitive components were reviewed, existing custody protections were revalidated, external content risks were investigated and backup integrity was checked.

The Telegram/PIN security design and consolidated deployment architecture continued progressing as part of a wider effort to make Devis Cooking safer, easier to maintain and more resilient to future security threats.
