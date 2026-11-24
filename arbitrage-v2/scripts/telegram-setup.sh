#!/usr/bin/env bash
set -euo pipefail
: "${TELEGRAM_BOT_TOKEN:?manquant}" "${TELEGRAM_WEBHOOK_SECRET:?manquant}" "${SUPABASE_PROJECT_REF:?manquant}"
API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"
URL="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/telegram-webhook"
echo "1) Bot :"; curl -s "$API/getMe"; echo
echo "2) Fonction :"; curl -s "$URL"; echo
echo "3) setWebhook :"; curl -s "$API/setWebhook" -d "url=$URL" -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" -d 'allowed_updates=["message"]' -d drop_pending_updates=true; echo
echo "4) getWebhookInfo (voir last_error_message) :"; curl -s "$API/getWebhookInfo"; echo
