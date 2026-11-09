import * as vscode from 'vscode';

import { DOCUMENTATION_URL, MCP_ENDPOINT, STUDIO_URL } from './constants';
import { checkMcpService } from './health';

export function activate(context: vscode.ExtensionContext): void {
  const definitionsChanged = new vscode.EventEmitter<void>();
  const extensionVersion = String(context.extension.packageJSON.version);

  context.subscriptions.push(
    definitionsChanged,
    vscode.lm.registerMcpServerDefinitionProvider('inttegro.mcp', {
      onDidChangeMcpServerDefinitions: definitionsChanged.event,
      provideMcpServerDefinitions: () => [
        new vscode.McpHttpServerDefinition(
          'Inttegro',
          vscode.Uri.parse(MCP_ENDPOINT),
          undefined,
          extensionVersion
        )
      ]
    }),
    vscode.commands.registerCommand('inttegro.checkMcpService', async () => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Checking the Inttegro MCP service'
        },
        async () => {
          try {
            const health = await checkMcpService();
            await vscode.window.showInformationMessage(
              `${health.resourceName} MCP is reachable and advertises OAuth.`
            );
          } catch (error) {
            const reason = error instanceof Error ? error.message : 'unknown error';
            await vscode.window.showErrorMessage(`Inttegro MCP check failed: ${reason}`);
          }
        }
      );
    }),
    vscode.commands.registerCommand('inttegro.openDocumentation', async () => {
      await vscode.env.openExternal(vscode.Uri.parse(DOCUMENTATION_URL));
    }),
    vscode.commands.registerCommand('inttegro.openStudio', async () => {
      await vscode.env.openExternal(vscode.Uri.parse(STUDIO_URL));
    })
  );
}

export function deactivate(): void {}
