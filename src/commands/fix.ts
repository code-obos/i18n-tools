import path from 'path';
import { getIntlFiles } from '../utils/get-intl-files.js';
import { validateStructure } from '../validator/validate.js';
import { getFilesystem } from '../utils/get-filesystem.js';
import { Command, program } from 'commander';

export const fixCommand: Command = program
    .createCommand('fix')
    .description('Attempts to fix validation issues by creating missing files')
    .argument('<srcDir>', 'source folder of your i18n files')
    .action(runFixCommand);

export async function runFixCommand(srcDir: string, exitOnSuccess?: boolean) {
    const files = getIntlFiles(srcDir);
    const result = validateStructure(files);
    if (!result.error) {
        console.log('No errors found');
        if (exitOnSuccess) {
            process.exit(0);
        }
    }
    result.printLogs();
    console.log('Attempting to fix errors...');

    const filecreated = new Set();
    for (const error of result.errors) {
        const filename = path.join(srcDir, `${error.missingKey}_${error.locale}.txt`);
        if (filecreated.has(filename)) continue;
        filecreated.add(filename);

        console.log(`Creating '${filename}'`);
        getFilesystem().writeFileSync(filename, `[${error.locale}] TODO`, { encoding: 'utf-8' });
    }
}
