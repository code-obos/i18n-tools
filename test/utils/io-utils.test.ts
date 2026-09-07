import { describe, it, expect, afterEach } from 'vitest';
import { vol } from 'memfs';
import { getAllFiles } from '../../src/utils/io-utils';

describe('getAllFiles', () => {
    afterEach(() => {
        vol.reset();
    });

    it('should should recursively return all files in directory', () => {
        vol.fromNestedJSON(
            {
                'first.txt': 'some content',
                'second.txt': 'some content',
                folder: {
                    'third.txt': 'some content',
                    nested: {
                        'fourth.txt': 'some content',
                    },
                },
            },
            '/app',
        );

        const files = getAllFiles('/app');
        const expectedFiles = [
            '/app/first.txt',
            '/app/second.txt',
            '/app/folder/third.txt',
            '/app/folder/nested/fourth.txt',
        ];
        expect(files).toHaveLength(4);
        expectedFiles.every((file) => expect(files).toContain(file));
    });

    it('should reach files nested several folders deep', () => {
        vol.fromNestedJSON(
            { propertyProject: { newLeadForm: { part1: { receipt: { 'heading_nb.txt': 'Takk' } } } } },
            '/app',
        );

        expect(getAllFiles('/app')).toEqual(['/app/propertyProject/newLeadForm/part1/receipt/heading_nb.txt']);
    });

    it('should not return the folders themselves', () => {
        vol.fromNestedJSON({ folder: { nested: { 'file.txt': 'x' } } }, '/app');

        expect(getAllFiles('/app')).toEqual(['/app/folder/nested/file.txt']);
    });

    it('should not return a folder that is named like a file', () => {
        // A folder called 'close_nb.txt' matches the intl file pattern, so it can only
        // be excluded by checking what it actually is on disk.
        vol.fromNestedJSON({ 'close_nb.txt': { 'inner_nb.txt': 'Lukk' } }, '/app');

        expect(getAllFiles('/app')).toEqual(['/app/close_nb.txt/inner_nb.txt']);
    });

    it('should return nothing for an empty folder tree', () => {
        vol.mkdirSync('/app/empty', { recursive: true });

        expect(getAllFiles('/app')).toEqual([]);
    });
});
