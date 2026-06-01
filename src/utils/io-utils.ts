import * as path from 'node:path';
import { getFilesystem } from './get-filesystem.js';

export function getAllFiles(directory: string): string[] {
    const fs = getFilesystem();
    return fs.readdirSync(directory).flatMap((file) => {
        const fullPath = path.join(directory, file.toString());
        const isDirectory = fs.lstatSync(fullPath).isDirectory();
        if (isDirectory) {
            return getAllFiles(fullPath);
        }
        return [fullPath];
    });
}
