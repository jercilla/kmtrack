#!/bin/bash

echo "🔍 Monitorizando GitHub Actions workflow..."
echo ""

while true; do
  # Get the latest run status
  RUN_STATUS=$(gh run list --limit 1 --json status,conclusion,name,displayTitle --jq '.[0]')

  STATUS=$(echo "$RUN_STATUS" | jq -r '.status')
  CONCLUSION=$(echo "$RUN_STATUS" | jq -r '.conclusion')
  NAME=$(echo "$RUN_STATUS" | jq -r '.name')
  TITLE=$(echo "$RUN_STATUS" | jq -r '.displayTitle')

  TIMESTAMP=$(date '+%H:%M:%S')

  if [ "$STATUS" = "completed" ]; then
    echo ""
    echo "[$TIMESTAMP] ✅ Workflow completado!"
    echo "  📝 Nombre: $NAME"
    echo "  💬 Commit: $TITLE"

    if [ "$CONCLUSION" = "success" ]; then
      echo "  ✅ Resultado: SUCCESS"
      echo ""
      echo "🎉 ¡Página publicada correctamente!"
      echo "🌐 URL: https://jercilla.github.io/kmtrack/"
      exit 0
    else
      echo "  ❌ Resultado: $CONCLUSION"
      echo ""
      echo "⚠️  El workflow falló. Revisa los logs:"
      gh run view --log-failed
      exit 1
    fi
  elif [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "queued" ]; then
    echo "[$TIMESTAMP] ⏳ Estado: $STATUS - $TITLE"
    sleep 10
  else
    echo "[$TIMESTAMP] ⚠️  Estado desconocido: $STATUS"
    sleep 10
  fi
done
