import { IntlFile } from './intl-file.js';
import { getAllFiles } from './io-utils.js';

const filePattern = /_[\w_]+\.(?:txt|html|md)$/;
export function getIntlFiles(directory: string): IntlFile[] {
    return getAllFiles(directory)
        .filter((file) => filePattern.test(file))
        .map((file) => IntlFile.of(file, directory));
}
