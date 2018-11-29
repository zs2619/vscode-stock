'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import https = require('https');
// import http = require('http')
import axios from 'axios';
// import zlib = require('zlib');

// interface StockRealTimeInfo {
//     symbol:string
//     timestamp:number

// }
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "stock" is now active!');

    const axiosInstance = axios.create({
    baseURL: 'https://stock.xueqiu.com',
    timeout: 5000,
    headers:{'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate, br',
    },
    });


    let barItem=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,-100);
    barItem.text="XQ";
    barItem.command="extension.sayHello";
    barItem.show();

    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {

        axiosInstance.get('/v5/stock/realtime/pankou.json?symbol=SH603666')
        .then(function (response) {
            // handle success
            let info=response.data;
            console.log(info);
            vscode.window.showInformationMessage(JSON.stringify(info));
        })
        .catch(function (error) {
            // handle error
            console.log(error.response);
            vscode.window.showInformationMessage(JSON.stringify(error.response));
        })
        .then(function () {
            // always executed
        });

    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}