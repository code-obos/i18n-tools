import { describe, it, expect, afterEach, vi } from 'vitest';
import * as chokidar from 'chokidar';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

type Watcher = ReturnType<typeof chokidar.watch>;

/**
 * src/commands/watch.ts uses exactly three things from chokidar: watch(dir, {
 * ignoreInitial: true }), the 'all' event, and recursive coverage of nested folders
 * (apps/frontend nests messages four levels deep). These tests run against the real
 * filesystem so a chokidar upgrade that changes any of those fails here instead of in
 * nybolig-nettsider's intl:watch script.
 */
describe('chokidar api contract', () => {
    let dir = '';
    let watcher: Watcher | undefined;

    afterEach(async () => {
        await watcher?.close();
        watcher = undefined;
        if (dir) fs.rmSync(dir, { recursive: true, force: true });
        dir = '';
    });

    async function startWatching(): Promise<string[]> {
        const events: string[] = [];
        watcher = chokidar.watch(dir, { ignoreInitial: true });
        watcher.on('all', (event: string, changedPath: string) =>
            events.push(`${event} ${path.relative(dir, changedPath)}`),
        );
        await new Promise<void>((resolve) => watcher!.on('ready', () => resolve()));
        return events;
    }

    it('should report added files through the all event', async () => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-tools-watch-'));
        const events = await startWatching();

        fs.writeFileSync(path.join(dir, 'close_nb.txt'), 'Lukk');

        await vi.waitFor(() => expect(events).toContain('add close_nb.txt'), { timeout: 5000, interval: 25 });
    });

    it('should report files added in nested folders', async () => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-tools-watch-'));
        fs.mkdirSync(path.join(dir, 'propertyProject/newLeadForm/part1'), { recursive: true });
        const events = await startWatching();

        fs.writeFileSync(path.join(dir, 'propertyProject/newLeadForm/part1/heading_nb.txt'), 'Om deg');

        await vi.waitFor(
            () => expect(events).toContain(`add ${path.join('propertyProject/newLeadForm/part1/heading_nb.txt')}`),
            { timeout: 5000, interval: 25 },
        );
    });

    it('should report changes to existing files', async () => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-tools-watch-'));
        const file = path.join(dir, 'close_nb.txt');
        fs.writeFileSync(file, 'Lukk');
        const events = await startWatching();

        fs.writeFileSync(file, 'Lukk vinduet');

        await vi.waitFor(() => expect(events).toContain('change close_nb.txt'), { timeout: 5000, interval: 25 });
    });

    it('should not report existing files as added when ignoreInitial is set', async () => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-tools-watch-'));
        fs.writeFileSync(path.join(dir, 'close_nb.txt'), 'Lukk');
        const events = await startWatching();

        await new Promise((resolve) => setTimeout(resolve, 250));

        // A 'change' can still arrive for a file written just before the watcher
        // started; ignoreInitial only promises no 'add' for the initial scan.
        expect(events.filter((event) => event.startsWith('add'))).toEqual([]);
    });
});
