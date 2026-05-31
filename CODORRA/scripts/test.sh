#!/usr/bin/env bash

# Demo user id (UUID) - override via API_DEMO_ID env var if desired
DEMO_ID=${API_DEMO_ID:-9764b712-eaf7-4836-895f-d5a4348b2bb5}

BASE=${API_BASE:-http://localhost:3001}

echo "Health check:"
curl -s ${BASE}/health | jq || curl -s ${BASE}/health

echo "\nExposure assessment:"
curl -s -X POST ${BASE}/api/assessments/exposure \
  -H "Content-Type: application/json" \
  -H "x-demo-user-id: ${DEMO_ID}" \
  -d '{"publicInstagram":true,"locationSharing":false}' | jq


echo "\nActivate emergency:"
curl -s -X POST ${BASE}/api/emergency/activate \
  -H "Content-Type: application/json" \
  -H "x-demo-user-id: ${DEMO_ID}" \
  -d '{"reason":"Threat received","exposureAnswers":{"publicInstagram":true},"threatAnswers":{"directThreats":true}}' | jq


echo "\nList evidence:"
curl -s ${BASE}/api/evidence -H "x-demo-user-id: ${DEMO_ID}" | jq


echo "\nList audit logs:"
curl -s ${BASE}/api/audit -H "x-demo-user-id: ${DEMO_ID}" | jq


echo "\nNote: to test file upload, run the curl multipart example in the README."
