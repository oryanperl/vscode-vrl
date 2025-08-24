import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';
import * as path from 'path';

export class VrlLanguageClient {
    private client: LanguageClient | undefined;

    constructor(private context: vscode.ExtensionContext) {}

    public start(): void {
        const serverModule = path.join(this.context.extensionPath, 'out', 'server.js');
        
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: { execArgv: ['--nolazy', '--inspect=6009'] }
            }
        };

        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: 'file', language: 'vrl' }],
            synchronize: {
                fileEvents: vscode.workspace.createFileSystemWatcher('**/*.vrl')
            }
        };

        this.client = new LanguageClient(
            'vrlLanguageServer',
            'VRL Language Server',
            serverOptions,
            clientOptions
        );

        this.client.start();
    }

    public stop(): Thenable<void> | undefined {
        if (!this.client) {
            return undefined;
        }
        return this.client.stop();
    }

    public getClient(): LanguageClient | undefined {
        return this.client;
    }
}