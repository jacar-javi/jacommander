#!/bin/bash

# Script to configure branch protection rules for JaCommander
# Requires: GitHub CLI (gh) installed and authenticated
# Usage: ./setup-branch-protection.sh

set -e

REPO="jacar-javi/jacommander"
BRANCH="main"

echo "Setting up branch protection rules for ${REPO}..."
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "Configuring branch protection for '${BRANCH}' branch..."

# Enable branch protection with comprehensive rules
gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/${REPO}/branches/${BRANCH}/protection" \
    --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {"context": "build"},
      {"context": "test"},
      {"context": "lint"}
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF

echo ""
echo "✓ Branch protection rules configured successfully!"
echo ""
echo "Protection rules applied:"
echo "  ✓ Require pull request reviews (1 approval)"
echo "  ✓ Require code owner reviews"
echo "  ✓ Dismiss stale reviews when new commits are pushed"
echo "  ✓ Require status checks to pass (build, test, lint)"
echo "  ✓ Require branches to be up to date before merging"
echo "  ✓ Require conversation resolution before merging"
echo "  ✓ Prevent force pushes"
echo "  ✓ Prevent branch deletion"
echo ""
echo "Note: Admins can still bypass these rules if needed."
echo ""
echo "View settings at: https://github.com/${REPO}/settings/branches"
