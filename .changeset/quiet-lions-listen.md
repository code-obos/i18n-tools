---
'@code-obos/i18n-tools': minor
---

Oppdaterer alle avhengigheter til siste major.

WHAT: chokidar 4 -> 5, commander 14 -> 15, @formatjs/cli-lib 8 -> 9, vitest 4 -> 5, typescript 5 -> 7, husky 8 -> 9, lint-staged 13 -> 17, @changesets/cli 2 -> 3, samt patch-bump av resten. Legger i tillegg til tester for CLI-parsing, watch-kommandoen og chokidar sitt API.

WHY: Utdaterte pakker, og ingen tester dekket CLI-laget der commander og chokidar faktisk brukes.

HOW: Ingen endring i generert output - snapshottestene for lut.ts og de kompilerte bundlene er uendret. Merk at commander 15 krever node >= 22.12.
