import { IntlFile } from '../utils/intl-file.js';
import { camelCase } from '../utils/string-utils.js';

export interface IntlLocaleBundle {
    [locale: string]: IntlBundle;
}

export interface IntlBundle {
    [key: string]: IntlFile | IntlBundle;
}

export function createMessageBundle(files: IntlFile[]): IntlLocaleBundle {
    const localebundle: IntlLocaleBundle = {};
    for (const file of files) {
        const pathparts = [file.locale, ...file.getPathParts()];
        let current: IntlBundle = localebundle;
        for (const pathpart of pathparts) {
            const next = (current[camelCase(pathpart)] ?? {}) as IntlBundle;
            current[camelCase(pathpart)] = next;
            current = next;
        }

        current[camelCase(file.shortTextId)] = file;
    }
    return localebundle;
}
