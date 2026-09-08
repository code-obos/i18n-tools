import * as path from 'node:path';
import { getFilesystem } from './get-filesystem.js';

export function getAllFiles(directory: string): string[] {
    const fs = getFilesystem();
    const entries = fs.readdirSync(directory, { recursive: true }) as unknown as string[];

    return entries
        .map((entry) => path.join(directory, entry.toString()))
        .filter((entryPath) => !fs.lstatSync(entryPath).isDirectory());
}
