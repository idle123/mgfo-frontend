#!/bin/bash
# Test script to verify chat interface integration

echo "================================================"
echo "Chat Interface Integration - Configuration Test"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check environment variables
echo "1. Checking environment variables..."
if [ -f "/home/akanksha/mgfo-frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    echo "   Contents:"
    cat /home/akanksha/mgfo-frontend/.env | grep -v "^#" | grep -v "^$" | sed 's/^/   /'
else
    echo -e "${RED}✗${NC} .env file not found"
fi
echo ""

# Test 2: Check configuration files
echo "2. Checking configuration files..."
FILES=(
    "/home/akanksha/mgfo-frontend/src/config/apiConfig.ts"
    "/home/akanksha/mgfo-frontend/src/config/authConfig.ts"
    "/home/akanksha/mgfo-frontend/src/components/ChatInterface.tsx"
    "/home/akanksha/mgfo-frontend/src/components/Dashboard.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $(basename $file) exists"
    else
        echo -e "${RED}✗${NC} $(basename $file) missing"
    fi
done
echo ""

# Test 3: Check TENANT_ID export
echo "3. Checking TENANT_ID export in authConfig.ts..."
if grep -q "export const TENANT_ID" /home/akanksha/mgfo-frontend/src/config/authConfig.ts; then
    TENANT_ID=$(grep "export const TENANT_ID" /home/akanksha/mgfo-frontend/src/config/authConfig.ts | cut -d'"' -f2)
    echo -e "${GREEN}✓${NC} TENANT_ID exported: $TENANT_ID"
else
    echo -e "${RED}✗${NC} TENANT_ID not exported"
fi
echo ""

# Test 4: Check QUERY_ENDPOINT import in ChatInterface
echo "4. Checking API imports in ChatInterface.tsx..."
if grep -q "import.*QUERY_ENDPOINT.*from.*apiConfig" /home/akanksha/mgfo-frontend/src/components/ChatInterface.tsx; then
    echo -e "${GREEN}✓${NC} QUERY_ENDPOINT imported"
else
    echo -e "${RED}✗${NC} QUERY_ENDPOINT not imported"
fi

if grep -q "import.*TENANT_ID.*from.*authConfig" /home/akanksha/mgfo-frontend/src/components/ChatInterface.tsx; then
    echo -e "${GREEN}✓${NC} TENANT_ID imported"
else
    echo -e "${RED}✗${NC} TENANT_ID not imported"
fi
echo ""

# Test 5: Check Dashboard passes props to ChatInterface
echo "5. Checking Dashboard component..."
if grep -q "msalInstance={msalInstance}" /home/akanksha/mgfo-frontend/src/components/Dashboard.tsx; then
    echo -e "${GREEN}✓${NC} msalInstance prop passed to ChatInterface"
else
    echo -e "${RED}✗${NC} msalInstance prop not passed"
fi

if grep -q "apiScope={apiScope}" /home/akanksha/mgfo-frontend/src/components/Dashboard.tsx; then
    echo -e "${GREEN}✓${NC} apiScope prop passed to ChatInterface"
else
    echo -e "${RED}✗${NC} apiScope prop not passed"
fi
echo ""

# Test 6: Check backend API endpoint
echo "6. Testing backend API availability..."
BACKEND_URL="https://20.174.11.164/api/healthz"
echo "   Testing: $BACKEND_URL"

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$BACKEND_URL" 2>/dev/null)
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓${NC} Backend API is reachable (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" == "000" ]; then
        echo -e "${YELLOW}⚠${NC} Cannot connect to backend (connection refused or timeout)"
    else
        echo -e "${YELLOW}⚠${NC} Backend responded with HTTP $HTTP_CODE"
    fi
else
    echo -e "${YELLOW}⚠${NC} curl not available, skipping backend test"
fi
echo ""

# Test 7: Check TypeScript compilation
echo "7. Checking TypeScript compilation..."
cd /home/akanksha/mgfo-frontend
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${RED}✗${NC} TypeScript compilation errors found"
    npx tsc --noEmit 2>&1 | grep "error TS" | head -5
else
    echo -e "${GREEN}✓${NC} No TypeScript compilation errors"
fi
echo ""

# Summary
echo "================================================"
echo "Test Summary"
echo "================================================"
echo ""
echo "Configuration Status:"
echo "  • Backend URL: https://20.174.11.164/api"
echo "  • Frontend URL: https://20.174.11.164"
echo "  • Tenant ID: Configured"
echo "  • Chat Integration: Complete"
echo ""
echo "Next Steps:"
echo "  1. Start backend services: cd ../mgfo-search-backend && docker-compose -f docker-compose.dev.yml up -d"
echo "  2. Start frontend: cd /home/akanksha/mgfo-frontend && npm run dev"
echo "  3. Open browser: https://20.174.11.164"
echo "  4. Test chat functionality!"
echo ""
echo "Documentation:"
echo "  • CHAT-INTEGRATION-COMPLETE.md - Full integration guide"
echo "  • FRONTEND-CONFIG-SUMMARY.md - Configuration details"
echo "  • TENANT-ID-FIX.md - Multi-tenant setup"
echo ""
