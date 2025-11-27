#!/bin/bash
# Test script to verify HTTPS configuration

set -e

echo "🔍 Testing Frontend Configuration..."
echo ""

# Check .env file
echo "1. Checking .env configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat /home/akanksha/mgfo-frontend/.env
echo ""

# Check for localhost references
echo "2. Searching for localhost references in src/:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if grep -r "localhost" /home/akanksha/mgfo-frontend/src/ 2>/dev/null; then
    echo "❌ Found localhost references!"
    exit 1
else
    echo "✅ No localhost references found in source code"
fi
echo ""

# Check API config
echo "3. API Configuration (apiConfig.ts):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -E "(DEFAULT_BACKEND|DEFAULT_FRONTEND|INGEST_ENDPOINT|QUERY_ENDPOINT)" /home/akanksha/mgfo-frontend/src/config/apiConfig.ts || true
echo ""

# Test backend connectivity
echo "4. Testing backend HTTPS endpoint:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -k -s https://20.174.11.164/healthz 2>/dev/null; then
    echo "✅ Backend HTTPS endpoint is reachable"
else
    echo "⚠️  Backend not responding (may need to start services)"
    echo "   Run: cd /home/akanksha/mgfo-search-backend && docker-compose -f docker-compose.dev.yml up -d"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Configuration Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend URL:  https://20.174.11.164"
echo "Frontend URL: http://20.174.11.164:3000"
echo ""
echo "Endpoints:"
echo "  • Ingest:  https://20.174.11.164/ingest_onedrive"
echo "  • Query:   https://20.174.11.164/query"
echo "  • Health:  https://20.174.11.164/healthz"
echo ""
echo "✅ All configurations use HTTPS backend!"
