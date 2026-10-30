# Devis Cooking — Weekly Development Update  
## From Trading Rules to Live On-Chain Automation

This week was a major development milestone for **Devis Cooking**.

A large part of the work focused on taking the Cooking strategy system beyond creating and displaying trading rules and turning it into a genuine automated execution engine capable of detecting market conditions, preparing trades, signing them with a strategy wallet, submitting them through Jupiter and Solana, and tracking them through completion.

The result is an increasingly complete automation pipeline — and, just as importantly, a much clearer picture of the reliability work required before we consider the system fully hardened.

---

## Automated Cooking Strategies Are Now Executing On-Chain

The biggest milestone of the week was proving the complete strategy lifecycle.

A Cooking strategy can now move through the full process:

**Create Rule → Watch Price → Detect Trigger → Queue Execution → Build Jupiter Trade → Sign Transaction → Submit to Solana → Confirm → Complete**

During live testing we successfully captured automatic strategy executions progressing through:

**Queued → Processing → Submitted → Completed**

with the resulting transaction confirmed on Solana and the strategy execution lane released correctly afterward.

This is an important step for Cooking because it means the automation layer is no longer simply generating alerts or simulated trading decisions.

It is capable of performing an actual decentralized exchange transaction when the user's configured market condition becomes true.

---

## Bringing Strategy Trades Onto the Same Execution Infrastructure

One of the main architectural improvements this week was reducing duplicated trade logic.

Rather than maintaining a completely separate transaction system for automated strategies, Cooking strategies now make use of the same hardened custodial transaction infrastructure used by other trading functions such as Quick Buy and Quick Sell.

That gives us a much cleaner execution model:

**Manual trade**

and

**Automated strategy trade**

eventually converge on the same transaction-signing and Solana submission infrastructure.

The automation layer still performs the additional work required for strategies — including price observation, rule evaluation, job creation and execution safety — but once an actual trade has been approved for execution, the blockchain interaction is handled by a common path.

We also retained an important safety rule for automated execution: strategy transactions use application-controlled delivery rather than blindly allowing an individual RPC provider to repeatedly submit the transaction. The live trigger path remains configured with zero internal transaction retries.

---

## Fixing a Critical Pre-Broadcast Transaction Bug

Live testing uncovered an important software bug inside the transaction sender.

The system could successfully:

- build the trade,
- sign the transaction,
- generate the expected transaction signature,

but fail before actual blockchain submission because of an undefined transaction parameter.

This produced a confusing situation where a transaction had a signature and appeared to need reconciliation even though it had never actually been broadcast.

We traced the issue to the transaction delivery helper, corrected the faulty parameter reference and confirmed that the hardened multi-RPC transaction code remained intact afterward.

This was an especially useful discovery because it helped us clearly distinguish between two very different situations:

**A transaction that may have been submitted but has an uncertain confirmation state**

and

**A transaction that failed before broadcast and can never exist on-chain.**

That distinction is essential for preventing accidental duplicate trades.

---

## Execution Queue Recovery and Safety

The pre-broadcast failure exposed another issue.

Because a strategy could remain continuously inside its trigger condition, new execution decisions continued being generated while the original execution lane was blocked.

That eventually created hundreds of stale queued jobs.

Before cleaning anything, we froze the relevant automation workers, backed up the affected records and validated exactly which execution jobs were safe to terminate.

The cleanup identified **608 stale queued strategy jobs** and two proven pre-broadcast execution blockers. Those stale jobs were cancelled, the invalid blockers were terminated, and the SOL and stablecoin execution lanes were safely released.

After recovery the execution queue returned to:

**Queued: 0**  
**Processing: 0**  
**Reconciliation Required: 0**

with the relevant execution lanes released and the automation workers restored.

This was followed by a successful fresh automatic strategy execution, confirming that the underlying execution system was functioning again.

---

## Preventing Duplicate Strategy Jobs at the Database Level

Rather than simply cleaning the queue and waiting for the same problem to happen again, we changed the architecture.

Cooking now enforces the rule:

> A single strategy rule may have only one unresolved execution decision at a time.

Open states include:

- queued,
- processing,
- submitted,
- reconciliation required.

This protection exists at both the application layer and the database layer.

A MongoDB partial unique index now provides a race-safe final guard, meaning two price workers cannot simultaneously create separate unresolved jobs for the same rule.

The deployment verification confirmed:

**One Open Job Per Rule: PASS**  
**Database Race Guard: PASS**  
**Both Price Workers Updated: PASS**  
**Execution/Jupiter Path Unchanged: PASS**

This is particularly important as Cooking scales.

Users can still create many strategies, and many users can trade the same assets, but one continuously true rule can no longer flood the system with hundreds of duplicate execution decisions.

---

## Better Strategy Monitoring for Operators

Another major improvement this week was visibility.

We created dedicated Cooking strategy monitoring tools that can display the current automation state directly from the live system.

The status view includes:

- waiting strategies,
- draft strategies,
- completed strategies,
- trigger conditions,
- configured actions,
- trigger counts,
- active execution jobs,
- execution status,
- duplicate-open-job detection.

The tool can be run as a single snapshot or as a continuously updating live view.

At one clean checkpoint the strategy engine reported:

**6 completed executions**  
**0 queued jobs**  
**0 processing jobs**  
**0 submitted jobs**  
**0 reconciliation jobs**  
**0 rules with multiple open jobs**

This provides a much better operational view of the automation engine than manually inspecting database records and worker logs.

---

## RPC Failover and Transaction Reconciliation

Reliable blockchain infrastructure became another major area of work this week.

Devis Cooking already supports multiple Solana RPC endpoints, but live testing exposed a problem where one RPC provider had reached its usage limits.

The affected provider began returning HTTP 429 rate-limit responses.

At the same time, the secondary Solana RPC endpoint was able to locate and confirm the same transactions normally.

We updated the reconciliation workers so transaction verification could continue through the healthy RPC provider.

After the change, both reconciliation workers successfully queried the test transaction, receiving:

**HTTP 200**  
**Transaction finalized**  
**No transaction error**

and no new 429 responses were observed during the verification.

This work reinforces an important principle in Cooking's architecture:

**A blockchain application should not rely on a single RPC provider for critical state.**

---

## Strategy Wallet Balance Investigation

RPC rate limits also helped uncover a separate frontend issue.

At one point the Cooking strategy interface showed zero balances even though the strategy wallet still contained assets.

Direct Solana RPC reads confirmed that the wallet had both SOL and stablecoin balances while the external balance provider was returning a usage-limit error.

The backend already contains a multi-RPC fallback implementation for reading token accounts and native SOL balances.

Further investigation then revealed a frontend response-mapping problem.

The strategy balance API returns fields such as:

- wallet,
- base balance,
- quote balance,
- snapshot timestamp,

but the frontend client was attempting to read a nested `balances` property that does not exist.

The strategy page was also independently requesting balances through browser-side Solana RPC calls, creating a second balance implementation that could disagree with the backend.

The long-term direction is now clear: strategy balances should use a single authoritative backend balance path backed by the server-side RPC pool.

---

## Price Feed Reliability Is Now the Next Major Focus

The latest testing also revealed a separate rate-limit issue affecting market prices.

Cooking's price workers currently query Jupiter for token price snapshots.

During live operation, Jupiter began returning:

**HTTP 429 — Too Many Requests**

causing some price watcher ticks to fail.

This matters because automated strategies depend on fresh market observations.

If a price snapshot cannot be obtained, the rule engine cannot reliably determine whether a user's trigger condition is currently true.

This has given us the next major infrastructure target:

**Price acquisition needs the same resilience philosophy as transaction execution.**

That means introducing stronger caching, intelligent backoff, reduced duplicate requests and potentially additional price sources rather than treating one external API as permanently available.

---

## What We Learned This Week

One useful outcome of the work is that the Cooking architecture is now much easier to reason about.

There are three distinct reliability domains:

### Price Acquisition

Responsible for answering:

> What is the market doing right now?

This feeds strategy evaluation.

### Trade Execution

Responsible for:

> Build, sign and broadcast the user's trade safely.

This includes Jupiter routing and Solana transaction submission.

### Reconciliation

Responsible for:

> What actually happened to the transaction after submission?

This determines whether a transaction landed, failed, remains pending or requires additional verification.

Separating these concerns makes failures significantly easier to diagnose and prevents one subsystem from making unsafe assumptions about another.

---

## Where Cooking Stands Now

This week moved Cooking considerably closer to the system we originally wanted to build.

We have now proven a real automated trading lifecycle:

**User Rule → Market Trigger → Execution Decision → Jupiter Swap → Strategy Wallet Signature → Solana Transaction → Confirmation → Completed Strategy**

Around that core we have also added:

- RPC failover,
- execution lanes,
- duplicate-job protection,
- database-level race protection,
- transaction reconciliation,
- safe handling of uncertain transaction broadcasts,
- live strategy monitoring,
- stale queue recovery,
- strategy-wallet execution,
- shared Quick Trade and strategy transaction infrastructure,
- clearer separation between pricing, execution and reconciliation.

The remaining work is increasingly about **resilience rather than basic functionality**.

Our current priorities are:

1. strengthening the RPC pool so no single provider can degrade trading;
2. making strategy price feeds resistant to API rate limiting;
3. improving transaction reconciliation and stale-lane recovery;
4. consolidating strategy balance reads through the backend RPC pool;
5. adding explicit strategy expiry handling;
6. further restricting the custodial signing layer with stronger transaction validation, spending limits and program allowlists.

The important milestone is that automated Cooking strategies are no longer theoretical.

**They have executed real Jupiter trades on Solana from user-defined market conditions.**

The next stage is making that execution infrastructure increasingly difficult to interrupt, confuse or overload.

That is the work now underway.
