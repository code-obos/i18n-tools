import { IntlBundle } from './create-message-bundle.js';
import { IntlFile } from '../utils/intl-file.js';
import { compileIcuMessageIntoFunction } from './compile-icu-message-into-function.js';
import { normalizeId } from '../utils/string-utils.js';

export function compileIntlLutBundle(bundle: IntlBundle, useTypescript: boolean): string {
    const out = [];
    if (useTypescript) {
        out.push('import React from "react";');
        out.push('import {IntlShape} from "@formatjs/intl";');
        out.push('// @ts-ignore');
        out.push('import {FormatXMLElementFn} from "intl-messageformat";');
        out.push('');
        out.push('export function createIntlLUT(intl: IntlShape<React.ReactNode>) {');
    } else {
        out.push('export function createIntlLUT(intl) {');
    }
    out.push(`${createIndent(1)}return {`);
    recursiveAppend(bundle, out, 2, useTypescript);
    out.push(`${createIndent(1)}}`);
    out.push('}');
    return out.join('\n');
}

function recursiveAppend(bundle: IntlBundle, out: string[], indent: number = 0, useTypescript: boolean) {
    Object.entries(bundle).forEach(([key, value]) => {
        if (value instanceof IntlFile) {
            const normalizedId = normalizeId(value.textId);
            const [_, fn] = compileIcuMessageIntoFunction(normalizedId, value.content, useTypescript);
            out.push(`${createIndent(indent)}"${key}": ${fn},`);
        } else {
            out.push(`${createIndent(indent)}"${key}": {`);
            recursiveAppend(value, out, indent + 1, useTypescript);
            out.push(`${createIndent(indent)}},`);
        }
    });
}

function createIndent(indent: number): string {
    return ' '.repeat(2 * indent);
}
