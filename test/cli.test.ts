import { describe, it, expect, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import type { Command } from 'commander';
import { nyboligBuildFlags, nyboligMessages } from './fixtures/nybolig-usage';

const srcDir = '/app/src/intl/messages';
const outDir = '/app/src/intl/compiled';

/**
 * Commander keeps parsed option values on the Command instance, and the commands are
 * module level singletons, so every test gets a freshly imported instance. Output is
 * silenced and exits are turned into exceptions so parse errors can be asserted.
 */
async function freshCommand(name: 'build' | 'watch' | 'validate' | 'fix'): Promise<Command> {
    vi.resetModules();
    const command: Command = await {
        build: async () => (await import('../src/commands/build')).buildCommand,
        watch: async () => (await import('../src/commands/watch')).watchCommand,
        validate: async () => (await import('../src/commands/validate')).validateCommand,
        fix: async () => (await import('../src/commands/fix')).fixCommand,
    }[name]();

    return command.exitOverride().configureOutput({ writeOut: () => {}, writeErr: () => {} });
}

async function runCli(name: 'build' | 'watch' | 'validate' | 'fix', args: string[]): Promise<void> {
    const command = await freshCommand(name);
    await command.parseAsync(args, { from: 'user' });
}

function readOut(file: string): string {
    return vol.readFileSync(`${outDir}/${file}`, 'utf-8').toString();
}

describe('cli argument parsing', () => {
    afterEach(() => {
        vol.reset();
        vi.restoreAllMocks();
    });

    describe('build', () => {
        it('should accept the exact invocation used by nybolig-nettsider', async () => {
            vol.fromNestedJSON(nyboligMessages, srcDir);

            await runCli('build', [srcDir, outDir, ...nyboligBuildFlags]);

            expect(Object.keys(vol.toJSON(outDir)).sort()).toEqual([
                `${outDir}/bundle_nb.compiled.json`,
                `${outDir}/bundle_nb.json`,
                `${outDir}/bundle_sv.compiled.json`,
                `${outDir}/bundle_sv.json`,
                `${outDir}/lut.ts`,
            ]);
        });

        it('should default to the formatjs format', async () => {
            vol.fromNestedJSON({ 'close_nb.txt': 'Lukk' }, srcDir);

            await runCli('build', [srcDir, outDir]);

            expect(JSON.parse(readOut('bundle_nb.json'))).toEqual({ close: { defaultMessage: 'Lukk' } });
        });

        it('should default --typescript to false, emitting a javascript lut', async () => {
            vol.fromNestedJSON({ 'close_nb.txt': 'Lukk' }, srcDir);

            await runCli('build', [srcDir, outDir, '--lut']);

            expect(Object.keys(vol.toJSON(outDir))).toContain(`${outDir}/lut.js`);
            expect(readOut('lut.js')).toContain('export function createIntlLUT(intl) {');
        });

        it('should map -t to the timeZone option and inject it into date skeletons', async () => {
            vol.fromNestedJSON({ 'date_nb.txt': '{d, date, ::yyyyMMdd}' }, srcDir);

            await runCli('build', [srcDir, outDir, '--ast', '-t', 'Europe/Oslo']);

            const compiled = JSON.parse(readOut('bundle_nb.compiled.json'));
            expect(compiled.date[0].style.parsedOptions.timeZone).toBe('Europe/Oslo');
        });

        it('should accept every documented format', async () => {
            for (const format of ['json', 'jsonlut', 'script', 'formatjs']) {
                vol.reset();
                vol.fromNestedJSON({ group: { 'close_nb.txt': 'Lukk' } }, srcDir);

                await runCli('build', [srcDir, outDir, '-f', format]);

                const written = Object.keys(vol.toJSON(outDir));
                const expectedExtension = format === 'script' ? 'js' : 'json';
                expect(written, format).toEqual([`${outDir}/bundle_nb.${expectedExtension}`]);
            }
        });

        it('should nest keys for the jsonlut format and keep them flat for json', async () => {
            vol.fromNestedJSON({ group: { 'close_nb.txt': 'Lukk' } }, srcDir);
            await runCli('build', [srcDir, outDir, '-f', 'jsonlut']);
            expect(JSON.parse(readOut('bundle_nb.json'))).toEqual({ group: { close: 'Lukk' } });

            vol.reset();
            vol.fromNestedJSON({ group: { 'close_nb.txt': 'Lukk' } }, srcDir);
            await runCli('build', [srcDir, outDir, '-f', 'json']);
            expect(JSON.parse(readOut('bundle_nb.json'))).toEqual({ 'group.close': 'Lukk' });
        });

        it('should reject an unknown format', async () => {
            vol.fromNestedJSON({ 'close_nb.txt': 'Lukk' }, srcDir);

            await expect(runCli('build', [srcDir, outDir, '-f', 'nope'])).rejects.toThrowError(
                /Allowed choices are script, json, jsonlut, formatjs/,
            );
        });

        it('should require both srcDir and outDir', async () => {
            await expect(runCli('build', [srcDir])).rejects.toThrowError(/missing required argument/);
        });

        it('should fail on --strict when the locales have different keys', async () => {
            vol.fromNestedJSON({ 'close_nb.txt': 'Lukk', 'open_sv.txt': 'Öppna' }, srcDir);

            await expect(runCli('build', [srcDir, outDir, '--strict'])).rejects.toThrowError();
        });

        it('should explain why --ast cannot be combined with -f script', async () => {
            vol.fromNestedJSON({ 'close_nb.txt': 'Lukk' }, srcDir);

            // Without the guard this fails inside JSON.parse with
            // "Unexpected token 'c', "const text"... is not valid JSON".
            await expect(runCli('build', [srcDir, outDir, '-f', 'script', '--ast'])).rejects.toThrowError(
                /--ast is not available with '-f script'/,
            );
        });

        it('should still allow --ast with the json formats', async () => {
            for (const format of ['json', 'jsonlut', 'formatjs']) {
                vol.reset();
                vol.fromNestedJSON({ 'close_nb.txt': 'Lukk' }, srcDir);

                await runCli('build', [srcDir, outDir, '-f', format, '--ast']);

                expect(Object.keys(vol.toJSON(outDir)), format).toContain(`${outDir}/bundle_nb.compiled.json`);
            }
        });

        it('should expose exactly the documented options', async () => {
            const build = await freshCommand('build');

            expect(build.options.map((option) => option.flags)).toEqual([
                '-f, --format <format>',
                '--typescript',
                '--strict',
                '--ast',
                '--lut',
                '-t, --timeZone <timezone>',
            ]);
        });
    });

    describe('watch', () => {
        it('should expose the same options as build, so intl:watch can mirror intl', async () => {
            const build = await freshCommand('build');
            const watch = await freshCommand('watch');

            const describeOptions = (command: Command) =>
                command.options
                    .map((option) => `${option.flags} | ${option.description} | ${option.defaultValue}`)
                    .join('\n');

            expect(describeOptions(watch)).toEqual(describeOptions(build));
        });
    });

    describe('validate', () => {
        it('should pass when every locale has the same keys', async () => {
            vol.fromNestedJSON(nyboligMessages, srcDir);

            await expect(runCli('validate', [srcDir])).resolves.toBeUndefined();
        });

        it('should fail when a key is missing in one locale', async () => {
            vol.fromNestedJSON({ 'close_nb.txt': 'Lukk', 'close_sv.txt': 'Stäng', 'open_nb.txt': 'Åpne' }, srcDir);

            await expect(runCli('validate', [srcDir])).rejects.toThrowError();
        });

        it('should require srcDir', async () => {
            await expect(runCli('validate', [])).rejects.toThrowError(/missing required argument/);
        });
    });

    describe('fix', () => {
        it('should create the missing files as TODO placeholders', async () => {
            vol.fromNestedJSON(
                { 'close_nb.txt': 'Lukk', 'close_sv.txt': 'Stäng', group: { 'open_nb.txt': 'Åpne' } },
                srcDir,
            );

            await runCli('fix', [srcDir]);

            expect(vol.readFileSync(`${srcDir}/group/open_sv.txt`, 'utf-8').toString()).toBe('[sv] TODO');
        });
    });
});
