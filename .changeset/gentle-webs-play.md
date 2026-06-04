---
'@code-obos/i18n-tools': major
---

legger til punktum seperator for å håndtere kryssplatform av windows og mac.

WHAT: Oppdaterer pakken med avhengigheter, node 24.

WHY: Utdaterte pakker.

HOW: Pakken endrer ting internt fra '/' til '.' i selve seperator i lut.ts, burde ikke ha noen praktisk betydning for bruk.
