#!/usr/bin/env bash
# ============================================================
#  DOK'PÉYI — Installation des hooks Git de sécurité
#  À exécuter une fois après `git clone` :
#    bash scripts/install-hooks.sh
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "🔒 Installation des hooks de sécurité Dok'péyi…"

# Vérifier qu'on est bien à la racine du repo
if [ ! -d ".git" ]; then
  echo -e "${RED}✗ Lance ce script depuis la racine du projet (là où se trouve .git/).${NC}"
  exit 1
fi

# Pointer git vers .githooks/ pour ce repo
git config core.hooksPath .githooks

# S'assurer que les hooks sont exécutables
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push

echo -e "${GREEN}✓ Hooks installés avec succès.${NC}"
echo ""
echo "  Hooks actifs :"
echo "  → pre-commit : bloque les secrets avant chaque commit"
echo "  → pre-push   : vérifie l'historique avant chaque push"
echo ""
echo -e "${YELLOW}  Pour vérifier la config :${NC}"
echo "  git config core.hooksPath"
echo ""
