/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2020-05-30 20:05:28
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 加载依赖
 *****************************************
 */
import * as vscode from 'vscode';
import Command, { TerminalOptions } from './Command';

const path = require("path")
const fs = require("fs")


/**
 *****************************************
 * 命令配置
 *****************************************
 */
export interface CommandOptions {
    cmd?: string;
    command?: string;
    terminal?: string | TerminalOptions;
    appendExplorerSelectedFiles?: boolean;
}


/**
 *****************************************
 * 激活扩展
 *****************************************
 */
export function activate(context: vscode.ExtensionContext): void {

    // 注册【运行】命令
    context.subscriptions.push(
        vscode.commands.registerCommand('command-runner.run', async (opts: CommandOptions = {}, files?: vscode.Uri[]) => {
            const command = new Command(context);
            const cmd = opts.command || opts.cmd || '';

            // 兼容终端名参数
            if (typeof opts.terminal === 'string') {
                opts.terminal = { name: opts.terminal };
            }

            // 添加选中的文件
            if (files && files.length) {
                files.forEach(argv => command.addFile(argv.fsPath));
            } else if (opts.appendExplorerSelectedFiles) {
                // Try to get the selected file from the explorer (Workaround)
                await vscode.commands.executeCommand('copyFilePath');
                const clipboardFiles = await vscode.env.clipboard.readText();
                clipboardFiles.split(/\r?\n/).forEach(f => command.addFile(f));
            }

            // 执行命令
            if (cmd) {
                return command.execute(command.commands[cmd] || cmd, opts.terminal);
            }

            // 选择命令并执行
            command.pick();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('command-runner.setupWorkspaceSettingsJson', () => {

            //Will try to create a file if it does not exist
            let tryCreateFile = () => {
                filePath = path.join(filePath, "settings.json")
                const jsonData = {
                    "command-runner.commands": {
                        "run hello_world": "echo \"hello world (you can add more commands to this workspace as you like\""
                    }
                }

                if (fs.existsSync(filePath)) {
                    vscode.window.showInformationMessage('A settings.json file inside a .vscode folder already exists, will not override it');
                } else {
                    fs.writeFile(filePath, JSON.stringify(jsonData, null, 4), (err: any) => {
                        if (err) {
                            vscode.window.showInformationMessage('Error creating or writing to settings.json');
                        }
                    })
                }
            }

            const workspaceRoot = vscode.workspace.rootPath;
            let filePath = path.join(workspaceRoot, ".vscode")

            //If folder does not exist, it will create it
            if (fs.existsSync(filePath)) {
                tryCreateFile()
            } else {
                fs.mkdir(filePath, (err: any) => {
                    if (err) {
                        vscode.window.showInformationMessage('Error creating .vscode folder');
                        vscode.window.showInformationMessage(err);
                    } else {
                        tryCreateFile()
                    }
                })
            }

        })
    );
}
