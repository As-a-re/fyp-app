#!/bin/bash
# Tavus Integration Diagnostic Script

echo "🔍 Tavus AI Integration Diagnostics"
echo "===================================="
echo ""

echo "Step 1: Check Backend Status"
echo "----"
curl -s http://localhost:5000/api/health
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running"
    echo "   Fix: Run 'npm start' in the backend directory"
fi
echo ""

echo "Step 2: Check Tavus API Connectivity"
echo "----"
curl -s -X POST https://tavusapi.com/v2/conversations \
  -H "x-api-key: af7e66d99b70478a85e92f9794c2220e" \
  -H "Content-Type: application/json" \
  -d '{"replica_id": "r55e6793f10f", "persona_id": "p8d9c57def77"}' \
  -w "\nStatus: %{http_code}\n" \
  -o /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Tavus API is reachable"
else
    echo "❌ Tavus API is NOT reachable"
    echo "   Fix: Check internet connection or firewall"
fi
echo ""

echo "Step 3: Check Backend Environment Variables"
echo "----"
if [ -f "backend/.env" ]; then
    echo "✅ .env file exists"
    grep -q "TAVUS_API_KEY" backend/.env && echo "  ✅ TAVUS_API_KEY set" || echo "  ❌ TAVUS_API_KEY missing"
    grep -q "TAVUS_API_URL" backend/.env && echo "  ✅ TAVUS_API_URL set" || echo "  ❌ TAVUS_API_URL missing"
    grep -q "TAVUS_PERSONA_ID" backend/.env && echo "  ✅ TAVUS_PERSONA_ID set" || echo "  ❌ TAVUS_PERSONA_ID missing"
    grep -q "TAVUS_REPLICA_ID" backend/.env && echo "  ✅ TAVUS_REPLICA_ID set" || echo "  ❌ TAVUS_REPLICA_ID missing"
else
    echo "❌ .env file does NOT exist"
    echo "   Fix: Create backend/.env with Tavus credentials"
fi
echo ""

echo "Step 4: Check Dependencies"
echo "----"
cd backend 2>/dev/null
npm list axios >/dev/null 2>&1 && echo "✅ axios installed" || echo "❌ axios NOT installed"
npm list express >/dev/null 2>&1 && echo "✅ express installed" || echo "❌ express NOT installed"
npm list dotenv >/dev/null 2>&1 && echo "✅ dotenv installed" || echo "❌ dotenv NOT installed"
cd ..
echo ""

echo "📝 Summary"
echo "---"
echo "If all checks pass, the error might be:"
echo "1. Authentication token invalid"
echo "2. Supabase database connection issue"
echo "3. WebView component not rendering properly"
echo ""
echo "Next steps:"
echo "1. Check browser console for detailed error messages"
echo "2. Check backend console for Tavus API logs"
echo "3. Verify authentication token is valid"
