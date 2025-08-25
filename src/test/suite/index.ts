import * as path from 'path';
import { glob } from 'glob';

export function run(): Promise<void> {
    // Create the mocha test
    const mocha = require('mocha');
    const testRunner = new mocha({
        ui: 'tdd',
        color: true,
    });

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((resolve, reject) => {
        glob('**/**.test.js', { cwd: testsRoot }, (err: any, files: string[]) => {
            if (err) {
                return reject(err);
            }

            files.forEach((f: string) => testRunner.addFile(path.resolve(testsRoot, f)));

            try {
                testRunner.run((failures: number) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    });
}
