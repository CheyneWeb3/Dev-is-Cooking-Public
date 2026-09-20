The migration does **not overwrite or convert the old `wallet.dat` in place**. It reads the old ZecWallet/`zcashd` wallet, extracts the wallet structure and keys, then creates a new **Zallet `wallet.db`**. The original `wallet.dat` stays untouched and should be kept permanently. ([Zcash][1])

For this Linux ZecWallet case, the process is essentially:

```text
Old ZecWallet
   ↓
~/.zcash/wallet.dat
   ↓
Zallet reads the Berkeley DB wallet
   ↓
extracts accounts / seeds / Sapling keys / transparent keys
   ↓
creates new Zallet accounts
   ↓
stores them in wallet.db
   ↓
Zallet scans the blockchain
   ↓
balance + transaction history reappear
```

Zallet actually uses a Berkeley DB 6.2 `db_dump` internally to parse the old `wallet.dat`, converts the contents into an intermediate Zcash wallet format in memory, and then imports that into the new wallet. ([Zcash][1])

### Actual sequence

Assuming the old Zcash directory is:

```bash
~/.zcash/
```

and contains:

```text
wallet.dat
zcash.conf
```

you first keep a safe copy of the whole thing.

Then install/run **Zebra (`zebrad`)**, because the new architecture separates the blockchain node from the wallet:

```text
Old:
zcashd = blockchain node + wallet

New:
zebrad = blockchain node
Zallet = wallet
```

Zallet needs the node so it can obtain chain information and later rescan for the wallet's transactions. ([Zcash][2])

Then migrate the old configuration:

```bash
zallet migrate-zcash-conf \
  --zcashd-datadir ~/.zcash \
  -o ~/.zallet/zallet.toml
```

Next create the encryption identity for the **new** wallet:

```bash
zallet -d ~/.zallet generate-encryption-identity -p
```

It asks them to choose a new passphrase.

Then:

```bash
zallet -d ~/.zallet init-wallet-encryption
```

Zallet requires this before it will import private key material. ([Zcash][3])

Then the actual import is:

```bash
zallet -d ~/.zallet migrate-zcashd-wallet \
  --zcashd-datadir ~/.zcash \
  --this-is-beta-code-and-you-will-need-to-redo-the-migration-later
```

That long final flag is currently required because **Zallet is still beta**. ([Zcash][1])

After the migration succeeds:

```bash
zallet -d ~/.zallet start
```

Then check sync progress:

```bash
zallet -d ~/.zallet rpc getwalletstatus
```

The wallet then scans the blockchain from the appropriate historical heights. **The balance may initially appear wrong or zero until scanning catches up.** ([Zcash][2])

### What normally comes across

Zallet currently migrates:

* mnemonic-derived accounts
* Sapling spending keys
* imported Sapling keys
* transparent private keys
* supported transparent watch-only entries
* account birthday information needed to find old transactions. ([Zcash][2])

The major exception is **Sprout**. Old Sprout spending keys/funds aren't supported by Zallet, so if the migration reports Sprout material, **stop there and keep the old `wallet.dat`** rather than forcing a partial migration. ([Zcash][1])

Also, I would **not use `--allow-partial-import` on the first attempt**. Without it, Zallet will stop and tell us exactly what it couldn't migrate. That's much safer for a recovery job.

Afterward, there are **three critical things to preserve**:

```text
OLD: ~/.zcash/wallet.dat

NEW: ~/.zallet/wallet.db

NEW: Zallet encryption identity file
```

A Zallet mnemonic by itself may **not** restore imported standalone keys, so those files matter. ([Zcash][1])

So for your affected user, I'd first get them to back up `~/.zcash`, then we can walk through **installing Zebra + Zallet and migrating the wallet one command at a time** rather than touching their only copy.

[1]: https://zcash.github.io/zallet/cli/migrate-zcashd-wallet.html?utm_source=chatgpt.com "migrate-zcashd-wallet - The Zallet Book"
[2]: https://zcash.github.io/zallet/zcashd/index.html?utm_source=chatgpt.com "Migrating from zcashd - The Zallet Book"
[3]: https://zcash.github.io/zallet/guide/setup.html?utm_source=chatgpt.com "Wallet setup - The Zallet Book"
