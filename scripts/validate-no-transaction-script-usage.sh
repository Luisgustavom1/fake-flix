#!/bin/bash

# ============================================================================
# Script: validate-no-transaction-script-usage.sh
# Purpose: Validate that SubscriptionBillingService is not used in active code
# Phase: 6 - Cleanup
# Date: January 22, 2026
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating absence of SubscriptionBillingService usage..."
echo ""

ERRORS_FOUND=0

# ============================================================================
# Check 1: Search for imports of SubscriptionBillingService
# ============================================================================

echo "📋 Check 1: Searching for imports..."

IMPORTS=$(grep -r "import.*SubscriptionBillingService" src/ \
  --include="*.ts" \
  --exclude-dir=__test__ \
  --exclude-dir=node_modules \
  --exclude="subscription-billing.service.ts" 2>/dev/null || true)

if [ -n "$IMPORTS" ]; then
  echo -e "${RED}❌ Found imports of SubscriptionBillingService:${NC}"
  echo "$IMPORTS"
  echo ""
  ERRORS_FOUND=1
else
  echo -e "${GREEN}✅ No imports found${NC}"
  echo ""
fi

# ============================================================================
# Check 2: Search for constructor injections
# ============================================================================

echo "📋 Check 2: Searching for constructor injections..."

INJECTIONS=$(grep -r "subscriptionBillingService:" src/ \
  --include="*.ts" \
  --exclude-dir=__test__ \
  --exclude-dir=node_modules \
  --exclude="subscription-billing.service.ts" 2>/dev/null || true)

if [ -n "$INJECTIONS" ]; then
  echo -e "${RED}❌ Found constructor injections:${NC}"
  echo "$INJECTIONS"
  echo ""
  ERRORS_FOUND=1
else
  echo -e "${GREEN}✅ No injections found${NC}"
  echo ""
fi

# ============================================================================
# Check 3: Search for method calls
# ============================================================================

echo "📋 Check 3: Searching for method calls..."

METHOD_CALLS=$(grep -r "subscriptionBillingService\." src/ \
  --include="*.ts" \
  --exclude-dir=__test__ \
  --exclude-dir=node_modules \
  --exclude="subscription-billing.service.ts" 2>/dev/null || true)

if [ -n "$METHOD_CALLS" ]; then
  echo -e "${RED}❌ Found method calls:${NC}"
  echo "$METHOD_CALLS"
  echo ""
  ERRORS_FOUND=1
else
  echo -e "${GREEN}✅ No method calls found${NC}"
  echo ""
fi

# ============================================================================
# Check 4: Search for provider registrations
# ============================================================================

echo "📋 Check 4: Searching for provider registrations..."

PROVIDER_REGISTRATIONS=$(grep -r "SubscriptionBillingService" src/ \
  --include="*.module.ts" \
  --exclude-dir=__test__ \
  --exclude-dir=node_modules 2>/dev/null || true)

if [ -n "$PROVIDER_REGISTRATIONS" ]; then
  echo -e "${YELLOW}⚠️  Found provider registrations:${NC}"
  echo "$PROVIDER_REGISTRATIONS"
  echo ""
  echo -e "${YELLOW}Note: This is expected before cleanup. Will be removed.${NC}"
  echo ""
else
  echo -e "${GREEN}✅ No provider registrations found${NC}"
  echo ""
fi

# ============================================================================
# Check 5: Verify Transaction Script file status
# ============================================================================

echo "📋 Check 5: Checking Transaction Script file..."

TRANSACTION_SCRIPT_PATH="src/module/billing/subscription/core/service/subscription-billing.service.ts"

if [ -f "$TRANSACTION_SCRIPT_PATH" ]; then
  echo -e "${YELLOW}⚠️  Transaction Script still exists:${NC}"
  echo "   $TRANSACTION_SCRIPT_PATH"
  echo ""
  echo -e "${YELLOW}Note: Will be removed during cleanup.${NC}"
  echo ""
else
  echo -e "${GREEN}✅ Transaction Script has been removed${NC}"
  echo ""
fi

# ============================================================================
# Final Summary
# ============================================================================

echo "═══════════════════════════════════════════════════════════════"
echo "                         SUMMARY"
echo "═══════════════════════════════════════════════════════════════"

if [ $ERRORS_FOUND -eq 1 ]; then
  echo -e "${RED}"
  echo "❌ VALIDATION FAILED"
  echo ""
  echo "SubscriptionBillingService is still being used in active code."
  echo "Please migrate all usages to Use Cases before proceeding with cleanup."
  echo -e "${NC}"
  exit 1
else
  echo -e "${GREEN}"
  echo "✅ VALIDATION PASSED"
  echo ""
  echo "No active usages of SubscriptionBillingService detected."
  echo "Safe to proceed with Phase 6 cleanup."
  echo -e "${NC}"
  
  if [ -f "$TRANSACTION_SCRIPT_PATH" ]; then
    echo ""
    echo "Next steps:"
    echo "  1. Create backup in backup/phase-6/"
    echo "  2. Remove provider from subscription.module.ts"
    echo "  3. Remove injection from subscription-billing.controller.ts"
    echo "  4. Delete $TRANSACTION_SCRIPT_PATH"
  fi
  
  exit 0
fi
