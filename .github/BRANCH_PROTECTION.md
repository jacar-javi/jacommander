# Branch Protection Configuration

This document describes the recommended branch protection rules for JaCommander.

## Quick Setup

### Option 1: Using the Script (Recommended)

```bash
# Make sure GitHub CLI is installed and authenticated
gh auth login

# Run the setup script
.github/scripts/setup-branch-protection.sh
```

### Option 2: Manual Configuration via GitHub CLI

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/jacar-javi/jacommander/branches/main/protection" \
  -f required_status_checks='{"strict":true,"contexts":["build","test","lint"]}' \
  -F enforce_admins=false \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}' \
  -F allow_force_pushes=false \
  -F allow_deletions=false \
  -F required_conversation_resolution=true
```

### Option 3: Manual Configuration via GitHub Web UI

1. Go to: https://github.com/jacar-javi/jacommander/settings/branches
2. Click "Add rule" or edit existing rule
3. Configure the following settings:

## Recommended Branch Protection Rules

### For `main` branch:

#### Pull Request Requirements
- **Require a pull request before merging**: ✅ Enabled
  - **Require approvals**: 1
  - **Dismiss stale pull request approvals when new commits are pushed**: ✅
  - **Require review from Code Owners**: ✅
  - **Require approval of the most recent reviewable push**: ❌ (optional)

#### Status Checks
- **Require status checks to pass before merging**: ✅ Enabled
  - **Require branches to be up to date before merging**: ✅
  - Required status checks:
    - `build` - Build must succeed
    - `test` - Tests must pass
    - `lint` - Code formatting must pass
    - `Docker Build and Test Docker Image` (optional)

#### Additional Settings
- **Require conversation resolution before merging**: ✅
- **Require signed commits**: ❌ (optional, can be enabled for extra security)
- **Require linear history**: ❌ (allows merge commits)
- **Include administrators**: ❌ (allows admins to bypass for emergencies)

#### Protection
- **Allow force pushes**: ❌ Disabled
  - Everyone (prevents history rewriting)
- **Allow deletions**: ❌ Disabled
- **Allow bypassing the above settings**: ❌

### For `develop` branch (if using):

Similar rules but with relaxed requirements:
- Require 1 approval
- Optional code owner reviews
- Status checks can be less strict

## Testing Branch Protection

After setting up, verify the rules work:

1. Try to push directly to main (should fail):
   ```bash
   git checkout main
   echo "test" >> test.txt
   git add test.txt
   git commit -m "test"
   git push  # Should be rejected
   ```

2. Create a PR and verify:
   - Cannot merge without approval
   - Cannot merge with failing checks
   - Must resolve conversations

## Bypassing Protection (Admins Only)

In emergency situations, admins can:
1. Temporarily disable protection rules
2. Make critical fixes
3. Re-enable protection immediately

**Always document why protection was bypassed!**

## CI/CD Integration

The branch protection rules work with GitHub Actions workflows:

- **ci.yml**: Runs tests and build checks
- **format.yml**: Ensures code formatting
- **docker.yml**: Validates Docker builds

These workflows must pass before PRs can be merged.

## Updating Protection Rules

To update rules:

1. Modify `.github/scripts/setup-branch-protection.sh`
2. Run the script again
3. Document changes in this file

## Troubleshooting

### "Status check required but not present"
- Ensure the workflow has run at least once on the branch
- Check workflow names match exactly in settings

### "Bypass restrictions"
- Check if admin override is enabled
- Verify your permissions in the repository

### "Cannot merge PR"
- Ensure all required reviews are approved
- Check that all status checks are passing
- Verify conversations are resolved

## Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CLI Documentation](https://cli.github.com/manual/gh_api)
- [Best Practices for Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
