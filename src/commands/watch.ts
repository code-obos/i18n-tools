import { Command, program } from 'commander';
import * as readline from 'readline';
import * as chokidar from 'chokidar';
import { validFormats, WatchOptions } from '../config.js';
import { runBuildCommand } from './build.js';
import logger from '../utils/logger.js';
import { runFixCommand } from './fix.js';

interface Key {
    sequence: string;
    name: string;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
}

export const watchCommand: Command = program
    .createCommand('watch')
    .description('Starts watching and rebundling files in <srcDir> into i18n files')
    .argument('<srcDir>', 'source folder of your i18n files')
    .argument('<outDir>', 'output folder for your i18n bundles')
    .addOption(program.createOption('-f, --format <format>', 'Output format').choices(validFormats).default('formatjs'))
    .option('--typescript', 'Output script files with typescript', false)
    .option('--strict', 'Run validation before bundling', false)
    .option('--ast', 'Compile generated bundles (only availble with formatjs)', false)
    .option('--lut', 'Generate look-up-table (only availble with formatjs)', false)
    .option('-t, --timeZone <timezone>', 'Inject timezone into date/time skeletons')
    .addHelpText('afterAll', '\n')
    .addHelpText('afterAll', 'Example: i18n-tool watch example/messages example/compiled --ast --lut --typescript')
    .action(runWatchCommand);

async function runWatchCommand(srcDir: string, outDir: string, config: WatchOptions) {
    const watcher = chokidar.watch(srcDir, { ignoreInitial: true });
    const buildConfig = { ...config, exitOnError: false, hasFixerListener: true };

    await runBuildCommand(srcDir, outDir, buildConfig);

    logger.info('Initial I18N-bundles created');
    watcher.on('all', (...args) => {
        logger.info('Recompiling I18N-bundles');
        runBuildCommand(srcDir, outDir, buildConfig);
        logger.info('Recompiled I18N-bundles');
    });

    readline.emitKeypressEvents(process.stdin);
    process.stdin.on('keypress', (ch: string, key: Key) => {
        if (key.ctrl && key.name === 'c') process.exit(0);
        if (key.name === 'f') {
            runFixCommand(srcDir, false);
        }
    });
    process.stdin.setRawMode(true);
}
