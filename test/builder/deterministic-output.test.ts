import { describe, it, expect, afterEach } from 'vitest';
import { vol } from 'memfs';
import { getIntlFiles } from '../../src/utils/get-intl-files';
import { sortIntlFiles } from '../../src/utils/intl-file';
import { compileIntlTextBundles } from '../../src/builder/compile-intl-text-bundles';
import { createMessageBundle, IntlBundle } from '../../src/builder/create-message-bundle';
import { compileIntlLutBundle } from '../../src/builder/compile-intl-lut-bundle';

const srcDir = '/app/messages';

/**
 * readdirSync hands out directory entries in whatever order the filesystem stores
 * them in, which is sorted on APFS but arbitrary on ext4. Since the generated bundles
 * are committed by consumers, the output has to be ordered by us rather than by the
 * filesystem, or the same messages produce different files on a laptop and in CI.
 *
 * memfs always returns sorted entries, so these tests shuffle the file list by hand to
 * simulate a filesystem that does not.
 */
const messages = {
    'zebra_nb.txt': 'Sebra',
    'apple_nb.txt': 'Eple',
    middle: {
        'one_nb.txt': 'En',
        'two_nb.txt': 'To',
    },
    'aardvark_nb.txt': 'Jordsvin',
};

function shuffledFiles() {
    const files = getIntlFiles(srcDir);
    // A fixed, deliberately wrong order: last file first, then the rest reversed.
    return [files[files.length - 1], ...files.slice(0, -1).reverse()];
}

describe('deterministic output', () => {
    afterEach(() => {
        vol.reset();
    });

    describe('sortIntlFiles', () => {
        it('should order files by normalized id regardless of input order', () => {
            vol.fromNestedJSON(messages, srcDir);

            expect(sortIntlFiles(shuffledFiles()).map((file) => file.textId)).toEqual([
                'aardvark',
                'apple',
                'middle/one',
                'middle/two',
                'zebra',
            ]);
        });

        it('should order the same ids by locale', () => {
            vol.fromNestedJSON({ 'close_sv.txt': 'Stang', 'close_nb.txt': 'Lukk', 'close_en.txt': 'Close' }, srcDir);
            const files = getIntlFiles(srcDir);

            expect(sortIntlFiles([files[2], files[0], files[1]]).map((file) => file.locale)).toEqual([
                'en',
                'nb',
                'sv',
            ]);
        });

        it('should not mutate the array it is given', () => {
            vol.fromNestedJSON(messages, srcDir);
            const files = shuffledFiles();
            const before = files.map((file) => file.textId);

            sortIntlFiles(files);

            expect(files.map((file) => file.textId)).toEqual(before);
        });
    });

    describe('compileIntlTextBundles', () => {
        it('should sort ids for every format', () => {
            vol.fromNestedJSON(messages, srcDir);
            const expected = ['aardvark', 'apple', 'middle.one', 'middle.two', 'zebra'];

            for (const format of ['json', 'jsonlut', 'formatjs'] as const) {
                const [[, content]] = compileIntlTextBundles(shuffledFiles(), format);
                const keys = Object.keys(JSON.parse(content));

                // jsonlut nests, so the middle.* ids collapse into one 'middle' key.
                const flattened = format === 'jsonlut' ? ['aardvark', 'apple', 'middle', 'zebra'] : expected;
                expect(keys, format).toEqual(flattened);
            }
        });

        it('should sort locales', () => {
            vol.fromNestedJSON({ 'close_sv.txt': 'Stang', 'close_nb.txt': 'Lukk', 'close_en.txt': 'Close' }, srcDir);
            const files = getIntlFiles(srcDir);

            const compiled = compileIntlTextBundles([files[2], files[0], files[1]], 'json');

            expect(compiled.map(([locale]) => locale)).toEqual(['en', 'nb', 'sv']);
        });
    });

    describe('createMessageBundle', () => {
        it('should sort keys at every level', () => {
            vol.fromNestedJSON(
                { ...messages, middle: { 'two_nb.txt': 'To', 'one_nb.txt': 'En', 'aaa_nb.txt': 'A' } },
                srcDir,
            );

            const bundle = createMessageBundle(shuffledFiles());

            expect(Object.keys(bundle.nb)).toEqual(['aardvark', 'apple', 'middle', 'zebra']);
            expect(Object.keys(bundle.nb.middle as IntlBundle)).toEqual(['aaa', 'one', 'two']);
        });
    });

    describe('order independence', () => {
        it('should produce identical text bundles for shuffled and sorted input', () => {
            vol.fromNestedJSON(messages, srcDir);

            const fromShuffled = compileIntlTextBundles(shuffledFiles(), 'formatjs');
            const fromSorted = compileIntlTextBundles(sortIntlFiles(getIntlFiles(srcDir)), 'formatjs');

            expect(fromShuffled).toEqual(fromSorted);
        });

        it('should produce an identical lut for shuffled and sorted input', () => {
            vol.fromNestedJSON(messages, srcDir);

            const fromShuffled = compileIntlLutBundle(Object.values(createMessageBundle(shuffledFiles()))[0], true);
            const fromSorted = compileIntlLutBundle(
                Object.values(createMessageBundle(sortIntlFiles(getIntlFiles(srcDir))))[0],
                true,
            );

            expect(fromShuffled).toEqual(fromSorted);
        });
    });
});
