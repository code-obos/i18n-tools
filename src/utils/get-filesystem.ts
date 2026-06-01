import * as fs from 'fs';
import { createRequire } from 'module';
import { IFs } from 'memfs';

const require = createRequire(import.meta.url);

let memfs: IFs | null = null;
try {
    memfs = require('memfs').fs;
} catch {}

export function getMemFs(): IFs {
    if (memfs !== null) {
        return memfs;
    }
    throw new Error('Illegally tried to access memfs, which should only be used for testing');
}

export function getFs(): IFs {
    return fs as unknown as IFs;
}

export function getFilesystem(): IFs {
    if (process.env.NODE_ENV === 'test') {
        return getMemFs();
    } else {
        return getFs();
    }
}
