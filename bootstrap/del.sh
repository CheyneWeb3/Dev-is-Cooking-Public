cd /opt/dndrecovery

cat > bootstrap/stage0-from-envgpg.sh <<'EOF_STAGE0'
#!/usr/bin/env bash
set -Eeuo pipefail

ENV_GPG="${DND_ENV_GPG:-/home/cheynespc/upload/env.gpg}"
RECOVERY_DIR="${DND_RECOVERY_DIR:-/opt/dndrecovery}"
RECOVERY_REPO_DEFAULT="git@github.com:CheyneWeb3/dndrecovery.git"
TMPDIR="$(mktemp -d /dev/shm/dnd-stage0.XXXXXX)"

cleanup() {
  rm -rf "$TMPDIR" 2>/dev/null || true
}
trap cleanup EXIT

echo
echo "=== DND Stage 0 bootstrap ==="
echo "No secrets are stored in this script."
echo "It uses env.gpg to clone the private dndrecovery repo."

echo
echo "=== install minimal packages ==="
if command -v apt-get >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y git curl ca-certificates gnupg openssh-client python3 jq
fi

echo
echo "=== check env.gpg ==="
if [[ ! -f "$ENV_GPG" ]]; then
  echo "STOP: missing $ENV_GPG"
  echo
  echo "Upload env.gpg first:"
  echo "  mkdir -p /home/cheynespc/upload"
  echo "  scp env.gpg root@NEW_LINODE_IP:/home/cheynespc/upload/env.gpg"
  exit 1
fi

chmod 600 "$ENV_GPG" 2>/dev/null || true

echo
echo "=== decrypt env.gpg to RAM only ==="
ENV_FILE="$TMPDIR/env"
gpg --quiet --decrypt --output "$ENV_FILE" "$ENV_GPG"
chmod 600 "$ENV_FILE"

set -a
source "$ENV_FILE"
set +a

: "${DND_RECOVERY_DEPLOY_KEY_PRIVATE_B64:?STOP: DND_RECOVERY_DEPLOY_KEY_PRIVATE_B64 missing in env.gpg}"

RECOVERY_REPO="${DND_RECOVERY_REPO:-$RECOVERY_REPO_DEFAULT}"
RECOVERY_BRANCH="${DND_RECOVERY_BRANCH:-main}"

echo
echo "=== prepare temporary recovery deploy key ==="
KEY="$TMPDIR/dndrecovery_ed25519"
printf '%s' "$DND_RECOVERY_DEPLOY_KEY_PRIVATE_B64" | base64 -d > "$KEY"
chmod 600 "$KEY"

export GIT_SSH_COMMAND="ssh -i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

echo
echo "=== prove dndrecovery Git access ==="
git ls-remote "$RECOVERY_REPO" "$RECOVERY_BRANCH" >/dev/null
echo "DNDRECOVERY_GIT_ACCESS=ok"

echo
echo "=== clone/update dndrecovery ==="
if [[ -d "$RECOVERY_DIR/.git" ]]; then
  cd "$RECOVERY_DIR"
  git fetch origin "$RECOVERY_BRANCH"
  git checkout "$RECOVERY_BRANCH"
  git reset --hard "origin/$RECOVERY_BRANCH"
else
  rm -rf "$RECOVERY_DIR"
  git clone --branch "$RECOVERY_BRANCH" "$RECOVERY_REPO" "$RECOVERY_DIR"
fi

echo
echo "=== install local recovery commands ==="
cd "$RECOVERY_DIR"
chmod +x bin/install-local-recovery-commands.sh
bin/install-local-recovery-commands.sh

echo
echo "=== Stage 0 complete ==="
echo "Run:"
echo "  dnd-recover"
EOF_STAGE0

chmod +x bootstrap/stage0-from-envgpg.sh
bash -n bootstrap/stage0-from-envgpg.sh
