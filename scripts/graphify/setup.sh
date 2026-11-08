#!/usr/bin/env bash
# Instala o graphify (grafo de conhecimento do código) e gera o grafo neste clone.
# Uso: npm run graph:setup   (Linux, macOS ou WSL; precisa de uv ou pipx)
set -euo pipefail

GRAPHIFY_VERSION="${GRAPHIFY_VERSION:-0.9.68}"
PKG="graphifyy[sql]==${GRAPHIFY_VERSION}"

cd "$(git rev-parse --show-toplevel)"

if command -v uv >/dev/null 2>&1; then
  uv tool install --force "$PKG"
elif command -v pipx >/dev/null 2>&1; then
  pipx install --force "$PKG"
else
  echo "graphify: instale o uv (curl -LsSf https://astral.sh/uv/install.sh | sh)" >&2
  echo "          ou o pipx (sudo apt install pipx) e rode de novo." >&2
  exit 1
fi

case ":$PATH:" in
  *":$HOME/.local/bin:"*) ;;
  *) echo "graphify: ~/.local/bin fora do PATH; rode uv tool update-shell (ou pipx ensurepath) e abra outro terminal." >&2
     export PATH="$HOME/.local/bin:$PATH" ;;
esac
graphify --version

# Diferente do Zapp Web V2: aqui NAO rodamos `graphify hook install`. O husky nao esta
# instalado neste repo (nao ha "husky" nas devDependencies nem script "prepare"), logo
# core.hooksPath nao aponta para .husky/_ e os hooks post-commit nao rodariam.
# Rebuild do grafo e manual: npm run graph:update.

PYTHONHASHSEED=0 graphify update .
