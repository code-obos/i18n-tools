import { IntlFile } from '../utils/intl-file.js';
import { camelCase } from '../utils/string-utils.js';
import { normalizeId } from '../utils/string-utils.js';

export interface IntlLocaleBundle {
    [locale: string]: IntlBundle;
}

export interface IntlBundle {
    [key: string]: IntlFile | IntlBundle;
}

export function createMessageBundle(files: IntlFile[]): IntlLocaleBundle {
    const localebundle: IntlLocaleBundle = {};

    for (const file of files) {
        const idParts = normalizeId(file.textId).split('.');
        const pathparts = [file.locale, ...idParts.slice(0, -1)];
        const lastPart = idParts[idParts.length - 1];

        let current: IntlBundle = localebundle;

        for (const pathpart of pathparts) {
            const key = camelCase(pathpart);
            const next = (current[key] ?? {}) as IntlBundle;
            current[key] = next;
            current = next;
        }

        current[camelCase(lastPart)] = file;
    }
    return localebundle;
}
