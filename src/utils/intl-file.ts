import * as pathUtils from 'path';
import { camelCase, normalizeId } from './string-utils.js';
import { getFilesystem } from './get-filesystem.js';

const languagePattern = /_([^\W_]+)\.\w+$/;
const removeLanguagePattern = /(?:_[^\W_]+)?\.\w+$/;

function findLocale(path: string): string {
    const match = languagePattern.exec(path);
    if (match) {
        return match[1];
    }
    throw new Error(
        `Could not locale for file: ${path}. This should have been caught be the library. Please report a bug.`,
    );
}

function findKey(path: string): string {
    return path.replace(removeLanguagePattern, '');
}

/**
 * Deliberately not localeCompare: its result depends on the ICU locale data of the
 * machine running the build, which would defeat the point of sorting at all.
 */
function compare(a: string, b: string): number {
    if (a === b) return 0;
    return a < b ? -1 : 1;
}

/**
 * Orders files by id so that generated bundles do not depend on the order the
 * filesystem happens to hand out directory entries in. Ids are normalized first, so
 * the ordering is the same on Windows (\) and unix (/).
 */
export function sortIntlFiles(files: IntlFile[]): IntlFile[] {
    return [...files].sort(
        (a, b) => compare(normalizeId(a.textId), normalizeId(b.textId)) || compare(a.locale, b.locale),
    );
}

export class IntlFile {
    private path: string;
    readonly textId: string;
    readonly shortTextId: string;
    readonly content: string;
    readonly locale: string;

    static of(path: string, relativeTo: string): IntlFile {
        return new IntlFile(path, relativeTo);
    }

    private constructor(path: string, relativeTo: string) {
        this.path = pathUtils.relative(relativeTo, path).replace('./', '');
        this.locale = findLocale(this.path);
        this.textId = findKey(findKey(this.path)).replace('./', '');
        this.shortTextId = camelCase(findKey(pathUtils.basename(this.path))).replace('./', '');
        this.content = getFilesystem().readFileSync(path, 'utf-8').toString();
    }

    getPathParts(): string[] {
        return pathUtils
            .dirname(this.path)
            .split('/')
            .filter((it) => it !== '.');
    }
}
