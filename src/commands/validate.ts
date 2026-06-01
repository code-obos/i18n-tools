import { Command, program } from 'commander';
import { getIntlFiles } from '../utils/get-intl-files.js';
import { validateStructure } from '../validator/validate.js';

export const validateCommand: Command = program
    .createCommand('validate')
    .description('Validate that every locale contains the same set of keys')
    .argument('<srcDir>', 'source folder of your i18n files')
    .action(runValidateCommand);

export async function runValidateCommand(srcDir: string) {
    const files = getIntlFiles(srcDir);
    const { error, printLogs } = validateStructure(files);
    if (error) {
        printLogs();
        throw new Error();
    } else {
        console.log('No errors found');
    }
}
