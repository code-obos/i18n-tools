import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import logger from '../../src/utils/logger';

const ESC = '\x1b';

describe('logger', () => {
    let written: string[] = [];

    beforeEach(() => {
        written = [];
        vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            written.push(chunk.toString());
            return true;
        });
        vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should prefix each level with its own colour', () => {
        logger.success('bygget');
        logger.info('bygger');
        logger.warn('advarsel');
        logger.error('feil');
        logger.fatal('fatalt');

        expect(written).toEqual([
            `${ESC}[32mSUCCESS${ESC}[0m bygget\n`,
            `${ESC}[36mINFO${ESC}[0m bygger\n`,
            `${ESC}[33mWARN${ESC}[0m advarsel\n`,
            `${ESC}[31mERROR${ESC}[0m feil\n`,
            `${ESC}[31mFATAL${ESC}[0m fatalt\n`,
        ]);
    });

    it('should open every colour with a real escape character', () => {
        // warn used to start with \x0b (vertical tab) rather than \x1b (escape), which
        // made terminals print a literal '[33m' and leave WARN uncoloured.
        logger.success('a');
        logger.info('b');
        logger.warn('c');
        logger.error('d');
        logger.fatal('e');

        for (const line of written) {
            expect(line.startsWith(ESC), line.replace(/\x1b/g, '<ESC>')).toBe(true);
            expect(line).not.toContain('\x0b');
        }
    });

    it('should reset the colour after the level, not after the message', () => {
        logger.warn('advarsel');

        expect(written[0]).toBe(`${ESC}[33mWARN${ESC}[0m advarsel\n`);
        expect(written[0].endsWith('advarsel\n')).toBe(true);
    });

    it('should write to stderr so piped bundles stay clean', () => {
        logger.info('bygger');

        expect(process.stderr.write).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).not.toHaveBeenCalled();
    });

    it('should end each line with exactly one newline', () => {
        logger.info('bygger');

        expect(written[0]).toMatch(/[^\n]\n$/);
    });
});
