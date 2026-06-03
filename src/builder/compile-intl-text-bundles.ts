import { IntlFile } from '../utils/intl-file.js';
import { Format } from '../config.js';
import { normalizeId } from '../utils/string-utils.js';

interface IntlTextBundles {
    [key: string]: IntlTextBundle;
}
interface IntlTextBundle {
    [key: string]: string;
}

type Formatter = (content: IntlTextBundle) => string;
const formatMap: Record<Format, Formatter> = {
    json: jsonFormatter,
    jsonlut: jsonLutFormatter,
    script: scriptFormatter,
    formatjs: formatjsFormatter,
};

export function compileIntlTextBundles(files: IntlFile[], format: Format): [string, string][] {
    const bundle = createTextBundle(files);
    const formatter: Formatter = formatMap[format];
    return Object.entries(bundle).map(([locale, content]) => [locale, formatter(content)]);
}

function jsonFormatter(content: IntlTextBundle): string {
    return JSON.stringify(content, null, 2);
}

function jsonLutFormatter(content: IntlTextBundle): string {
    const out = {};
    const entries = Object.entries(content);
    for (const [key, value] of entries) {
        const parts = key.split('.');
        let current: Record<string, any> = out;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            if (isLast) {
                current[part] = value;
            } else {
                current[part] = current[part] ?? {};
                current = current[part];
            }
        }
    }

    return JSON.stringify(out, null, 2);
}
function scriptFormatter(content: IntlTextBundle): string {
    return `const texts = ${jsonFormatter(content)};\n\nexport default texts;`;
}
function formatjsFormatter(content: IntlTextBundle): string {
    const reformattedContent = Object.fromEntries(
        Object.entries(content).map(([key, value]) => [key, { defaultMessage: value }]),
    );
    return JSON.stringify(reformattedContent, null, 2);
}

function createTextBundle(files: IntlFile[]): IntlTextBundles {
    return files.reduce((acc, file) => {
        const locale = file.locale;
        const key = normalizeId(file.textId);
        const content = file.content;

        const localeGroup = (acc[locale] ?? {}) as IntlTextBundle;
        localeGroup[key] = content;
        acc[locale] = localeGroup;
        return acc;
    }, {} as IntlTextBundles);
}
