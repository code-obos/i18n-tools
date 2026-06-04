import { describe, it, expect, afterEach } from 'vitest';
import { vol } from 'memfs';
import { buildVolumeFromFs } from '../build-volume-from-fs';
import { runBuildCommand } from '../../src/commands/build';

const defaultConfig = {
    srcDir: '/app/messages',
    outDir: '/app/compiled',
};

describe('build command', () => {
    afterEach(() => {
        vol.reset();
    });

    it('should build lut and compiled', async () => {
        vol.fromNestedJSON(
            {
                'ignore.txt': 'some content',
                'first_en.txt': 'first content',
                'first_nb.txt': 'first content',
                folder: {
                    'ignore.txt': 'some content',
                    'second_en.txt': 'some content',
                    'second_nb.txt': 'some content',
                    nested: {
                        'third_en.txt': 'second content',
                        'third_nb.txt': 'second content',
                    },
                },
            },
            '/app/messages',
        );

        await runBuildCommand(defaultConfig.srcDir, defaultConfig.outDir, {
            strict: true,
            typescript: true,
            ast: true,
            lut: true,
            format: 'formatjs',
        });

        expect(vol.toJSON('/app/compiled')).toMatchSnapshot();
    });

    it('should build lut in javascript', async () => {
        vol.fromNestedJSON(
            {
                'first_en.txt': 'first content',
                'first_nb.txt': 'first content',
                folder: {
                    'second_en.txt': 'some content',
                    'second_nb.txt': 'some content',
                },
            },
            '/app/messages',
        );

        await runBuildCommand(defaultConfig.srcDir, defaultConfig.outDir, {
            strict: true,
            typescript: false,
            ast: false,
            lut: true,
            format: 'script',
        });

        expect(vol.toJSON('/app/compiled')).toMatchSnapshot();
    });

    it('should build lut in typescript', async () => {
        vol.fromNestedJSON(
            {
                'first_en.txt': 'first content',
                'first_nb.txt': 'first content',
                folder: {
                    'second_en.txt': 'some content',
                    'second_nb.txt': 'some content',
                },
            },
            '/app/messages',
        );

        await runBuildCommand(defaultConfig.srcDir, defaultConfig.outDir, {
            strict: true,
            typescript: true,
            ast: false,
            lut: true,
            format: 'script',
        });

        expect(vol.toJSON('/app/compiled')).toMatchSnapshot();
    });

    it('should build json object', async () => {
        vol.fromNestedJSON(
            {
                'first_en.txt': 'first content',
                'first_nb.txt': 'first content',
                folder: {
                    'second_en.txt': 'some content',
                    'second_nb.txt': 'some content',
                },
            },
            '/app/messages',
        );

        await runBuildCommand(defaultConfig.srcDir, defaultConfig.outDir, {
            strict: true,
            typescript: false,
            ast: false,
            lut: false,
            format: 'json',
        });

        expect(vol.toJSON('/app/compiled')).toMatchSnapshot();
    });

    it('should build jsonlut object', async () => {
        vol.fromNestedJSON(
            {
                'first_en.txt': 'first content',
                'first_nb.txt': 'first content',
                folder: {
                    'second_en.txt': 'some content',
                    'second_nb.txt': 'some content',
                },
            },
            '/app/messages',
        );

        await runBuildCommand(defaultConfig.srcDir, defaultConfig.outDir, {
            strict: true,
            typescript: false,
            ast: false,
            lut: false,
            format: 'jsonlut',
        });

        expect(vol.toJSON('/app/compiled')).toMatchSnapshot();
    });

    it('should should inject timezone into skeletons', async () => {
        vol.fromNestedJSON(
            {
                'date_en.txt': 'starts { date, date, ::ddMMM } at { date, date, ::HHmm }',
            },
            '/app/messages',
        );

        await runBuildCommand(defaultConfig.srcDir, defaultConfig.outDir, {
            strict: true,
            typescript: true,
            ast: true,
            lut: true,
            format: 'formatjs',
            timeZone: 'Europe/Oslo',
        });

        expect(vol.toJSON('/app/compiled')).toMatchSnapshot();
    });

    it('should inject timezone into nested date-skeletons', async () => {
        const content = `<div>
{gender,select,
  male {<p>He was born {date,time,::ddMMM}</p>}
  female {<p>She was born {date,time,::ddMMM}</p>}
  other {<p>They was born {date,time,::ddMMM}</p>}
}.
</div>`;

        vol.fromNestedJSON(
            {
                'date_en.txt': content,
            },
            '/app/messages',
        );

        await runBuildCommand(defaultConfig.srcDir, defaultConfig.outDir, {
            strict: true,
            typescript: true,
            ast: true,
            lut: true,
            format: 'formatjs',
            timeZone: 'Europe/Oslo',
        });
        expect(vol.toJSON('/app/compiled')).toMatchSnapshot();
    });

    it('should throw error if validation is enabled and texts mismatch', async () => {
        vol.fromNestedJSON(
            {
                'first_en.txt': 'first content',
                'mismatch_nb.txt': 'first content',
            },
            '/app/messages',
        );

        await expect(
            (async () => {
                await runBuildCommand(defaultConfig.srcDir, defaultConfig.outDir, {
                    strict: true,
                    typescript: true,
                    ast: true,
                    lut: true,
                    format: 'formatjs',
                });
            })(),
        ).rejects.toThrowError('');
    });

    it('should compile example', async () => {
        vol.fromNestedJSON(buildVolumeFromFs('example/messages'), '/app/messages');

        await runBuildCommand(defaultConfig.srcDir, defaultConfig.outDir, {
            strict: true,
            typescript: true,
            ast: true,
            lut: true,
            format: 'formatjs',
        });

        expect(vol.toJSON('/app/compiled')).toMatchSnapshot();
    });
});
