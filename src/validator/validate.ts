import { IntlFile } from '../utils/intl-file.js';
import { groupBy } from '../utils/array-utils.js';
import * as SetUtils from '../utils/set-utils.js';

interface ValidationResult {
    error: boolean;
    errors: ValidationError[];
    printLogs: () => void;
}

interface ValidationError {
    locale: string;
    missingKey: string;
    keyFoundInLocale: string;
}
export function validateStructure(files: IntlFile[], hasFixerListener: boolean = false): ValidationResult {
    const errors: ValidationError[] = [];
    const logs: Array<() => void> = [];

    const localeKeyMap: Record<string, string[]> = files.reduce(
        groupBy(
            (it) => it.locale,
            (it) => it.textId,
        ),
        {},
    );
    const allLocales: string[] = Object.keys(localeKeyMap);

    for (let i = 0; i < allLocales.length; i++) {
        for (let j = 0; j < allLocales.length; j++) {
            if (i === j) continue;
            const baseLocale = allLocales[i];
            const otherLocale = allLocales[j];
            const baseLocaleKeys = new Set(localeKeyMap[baseLocale]);
            const otherLocaleKeys = new Set(localeKeyMap[otherLocale]);

            const missingInBase = SetUtils.difference(otherLocaleKeys, baseLocaleKeys);
            for (const missingKey of missingInBase) {
                errors.push({
                    locale: baseLocale,
                    keyFoundInLocale: otherLocale,
                    missingKey: missingKey,
                });
            }
            if (missingInBase.size > 0) {
                logs.push(() =>
                    console.log(`Locale ${baseLocale} is missing ${missingInBase.size} from ${otherLocale}`),
                );
                logs.push(() =>
                    console.log(
                        Array.from(missingInBase)
                            .map((it) => `\t${it}`)
                            .join('\n'),
                    ),
                );
                if (hasFixerListener) {
                    logs.push(() => console.log("\n\nPress 'f' to attempt to fix errors"));
                }
            }
        }
    }

    return {
        error: errors.length > 0,
        errors,
        printLogs() {
            logs.forEach((it) => it());
        },
    };
}
