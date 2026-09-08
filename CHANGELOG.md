# @code-obos/i18n-tools

## 5.0.0

### Major Changes

- ed637ce: Oppdaterer alle avhengigheter til siste major, og gjør generert output deterministisk.

    WHAT: chokidar 4 -> 5, commander 14 -> 15, @formatjs/cli-lib 8 -> 9, vitest 4 -> 5, typescript 5 -> 7, husky 8 -> 9, lint-staged 13 -> 17, @changesets/cli 2 -> 3, samt patch-bump av resten. `@formatjs/cli-lib` er flyttet til devDependencies siden den bare brukes som type, og `json-stable-stringify` er deklarert eksplisitt fordi den faktisk brukes i runtime. Meldinger sorteres nå etter id før bundling, `--ast` kombinert med `-f script` gir en forklarende feilmelding i stedet for en JSON-parsefeil, build og watch deler opsjonsdefinisjonene sine, og WARN-logglinjen er faktisk gul (fargekoden startet med \x0b i stedet for \x1b, så terminaler skrev ut `[33m` som tekst). I tillegg tester for CLI-parsing, watch-kommandoen, chokidar sitt API og sorteringen.

    WHY: Utdaterte pakker. Major fordi pakken nå krever node >= 22.12 og dermed slutter å støtte node 20: commander 15 krever det, og `engines` håndhever det. Rekkefølgen i `bundle_<locale>.json` og `lut.ts` fulgte tidligere rekkefølgen filsystemet ga ut katalogoppføringer i, som er sortert på macOS men vilkårlig på ext4. Samme meldinger kunne dermed gi ulike filer på en utviklermaskin og i CI.

    HOW: Sorteringen endrer rekkefølgen, ikke innholdet - verifisert mot 1268 meldingsfiler i nybolig-nettsider: identisk nøkkelsett, identiske verdier, og `bundle_<locale>.compiled.json` er bit-identisk. Konsumenter som gitignorerer generert output og regenererer den i et predev-steg, slik nybolig-nettsider gjør, merker ingen forskjell. Konsumenter som committer den, får en engangsomstokking til sortert rekkefølge. README er skrevet om: separatoren i eksemplene var fortsatt `/` fra før 4.0.0, og navnekonvensjonen for meldingsfiler og bruken av `createIntlLUT` var udokumentert.

## 4.0.0

### Major Changes

- b5f7d86: legger til punktum seperator for å håndtere kryssplatform av windows og mac.

    WHAT: Oppdaterer pakken med avhengigheter, node 24.

    WHY: Utdaterte pakker.

    HOW: Pakken endrer ting internt fra '/' til '.' i selve seperator i lut.ts, burde ikke ha noen praktisk betydning for bruk.
