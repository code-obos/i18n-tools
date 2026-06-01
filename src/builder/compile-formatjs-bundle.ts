/**
 * Source taken from https://github.com/formatjs/formatjs/blob/main/packages/cli-lib/src/compile.ts
 * in order to support memfs
 */
import type { CompileOpts } from '@formatjs/cli-lib';
import {
    parse,
    isDateElement,
    isTimeElement,
    isDateTimeSkeleton,
    isTagElement,
    isPluralElement,
    isSelectElement,
    MessageFormatElement,
} from '@formatjs/icu-messageformat-parser';
import stringify from 'json-stable-stringify';
import { getFilesystem } from '../utils/get-filesystem.js';

export type TZOpts = CompileOpts & { timeZone?: string };

export async function compile(inputFiles: string[], opts: TZOpts = {}): Promise<string> {
    const fs = getFilesystem();
    const { ast, skipErrors } = opts;

    const messages: Record<string, string> = {};
    const messageAsts: Record<string, MessageFormatElement[]> = {};
    const idsWithFileName: Record<string, string> = {};
    const filecompiler = inputFiles.map((file) =>
        fs.promises
            .readFile(file, { encoding: 'utf-8' })
            .then((content) => JSON.parse(content.toString()))
            .then((content) => normalizeMessages(content, file)),
    );
    const compiledFiles = await Promise.all(filecompiler);
    for (let i = 0; i < inputFiles.length; i++) {
        const inputFile = inputFiles[i];
        const compiled = compiledFiles[i];
        for (const id in compiled) {
            if (messages[id] && messages[id] !== compiled[id]) {
                throw new Error(`Conflicting ID "${id}" with different translation found in these 2 files:
ID: ${id}
Message from ${idsWithFileName[id]}: ${messages[id]}
Message from ${inputFile}: ${compiled[id]}
`);
            }
            try {
                const msgAst = injectTimeZone(opts.timeZone, parse(compiled[id]));
                messages[id] = compiled[id];
                messageAsts[id] = msgAst;
                idsWithFileName[id] = inputFile;
            } catch (e) {
                console.warn('Error validating message "%s" with ID "%s" in file "%s"', compiled[id], id, inputFile);
                if (!skipErrors) {
                    throw e;
                }
            }
        }
    }

    return (
        stringify(ast ? messageAsts : messages, {
            space: 2,
        }) ?? '{}'
    );
}

function normalizeMessages(content: unknown, file: string): Record<string, string> {
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
        throw new Error(`Expected a JSON object in ${file}`);
    }

    const out: Record<string, string> = {};
    for (const [id, value] of Object.entries(content)) {
        if (typeof value === 'string') {
            out[id] = value;
            continue;
        }

        if (value && typeof value === 'object' && 'defaultMessage' in value) {
            const defaultMessage = (value as { defaultMessage?: unknown }).defaultMessage;
            if (typeof defaultMessage === 'string') {
                out[id] = defaultMessage;
                continue;
            }
        }

        throw new Error(`Unsupported message entry for id "${id}" in ${file}`);
    }

    return out;
}

function injectTimeZone(timeZone: string | undefined, parts: MessageFormatElement[]): MessageFormatElement[] {
    if (!timeZone) return parts;
    return parts.map((part) => {
        if ((isDateElement(part) || isTimeElement(part)) && isDateTimeSkeleton(part.style)) {
            part.style.parsedOptions.timeZone = timeZone;
        } else if (isTagElement(part)) {
            return {
                ...part,
                children: injectTimeZone(timeZone, part.children),
            };
        } else if (isPluralElement(part) || isSelectElement(part)) {
            const options = Object.fromEntries(
                Object.entries(part.options).map(([key, value]) => {
                    return [key, { ...value, value: injectTimeZone(timeZone, value.value) }];
                }),
            );
            return { ...part, options };
        }
        return part;
    });
}
