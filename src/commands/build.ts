import { Command, program } from 'commander';
import * as path from 'path';
import { BuildOptions, validFormats } from '../config.js';
import { createMessageBundle, IntlLocaleBundle } from '../builder/create-message-bundle.js';
import { compileIntlTextBundles } from '../builder/compile-intl-text-bundles.js';
import { compileIntlLutBundle } from '../builder/compile-intl-lut-bundle.js';
import { getIntlFiles } from '../utils/get-intl-files.js';
import { validateStructure } from '../validator/validate.js';
import { getFilesystem } from '../utils/get-filesystem.js';
import { compile } from '../builder/compile-formatjs-bundle.js';

export const buildCommand: Command = program
    .createCommand('build')
    .description('Bundles files in <srcDir> into i18n files')
    .argument('<srcDir>', 'source folder of your i18n files')
    .argument('<outDir>', 'output folder for your i18n bundles')
    .addOption(program.createOption('-f, --format <format>', 'Output format').choices(validFormats).default('formatjs'))
    .option('--typescript', 'Output script files with typescript', false)
    .option('--strict', 'Run validation before bundling', false)
    .option('--ast', 'Compile generated bundles (only availble with formatjs)', false)
    .option('--lut', 'Generate look-up-table (only availble with formatjs)', false)
    .option('-t, --timeZone <timezone>', 'Inject timezone into date/time skeletons')
    .addHelpText('afterAll', '\n')
    .addHelpText('afterAll', 'Example: i18n-tool build example/messages example/compiled --ast --lut --typescript')
    .action(runBuildCommand);

export async function runBuildCommand(srcDir: string, outDir: string, config: BuildOptions) {
    const files = getIntlFiles(srcDir);
    const fs = getFilesystem();
    if (config.strict) {
        const { error, printLogs } = validateStructure(files, config.hasFixerListener ?? false);
        if (error) {
            printLogs();
            if (config.exitOnError ?? true) {
                throw new Error();
            }
        }
    }

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
    }

    if (config.lut) {
        const filename = config.typescript ? 'lut.ts' : 'lut.js';
        const bundle: IntlLocaleBundle = createMessageBundle(files);
        const lut = compileIntlLutBundle(Object.values(bundle)[0], config.typescript); // TODO fix
        fs.writeFileSync(path.join(outDir, filename), lut, { encoding: 'utf-8' });
    }

    const compiled = compileIntlTextBundles(files, config.format);
    const bundleFileExt = config.format === 'script' ? (config.typescript ? 'ts' : 'js') : 'json';
    for (const [locale, content] of compiled) {
        const filename = path.join(outDir, `bundle_${locale}.${bundleFileExt}`);
        fs.writeFileSync(filename, content, { encoding: 'utf-8' });

        if (config.ast) {
            const compiledFilename = path.join(outDir, `bundle_${locale}.compiled.json`);
            const compiledBundle = await compile([filename], {
                ast: true,
                timeZone: config.timeZone,
            });
            fs.writeFileSync(compiledFilename, compiledBundle, { encoding: 'utf-8' });
        }
    }
}
