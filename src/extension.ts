'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import https = require('https');
// import http = require('http')
import axios from 'axios';
// import zlib = require('zlib');

// interface Record{
//     price:number;
//     amount:number;
// }
interface StockRealTimeInfo {
    symbol:string;
    timeStamp:number;
    current:number;
    // sellRecord:Record[];
    // buyRecord:Record[];
}
function parseRealTimeInfo(response:any) {
    let pankou:StockRealTimeInfo={
        symbol:response["symbol"],
        timeStamp:response["timestamp"],
        current:response["current"],
    };
    return pankou;
}
export function activate(context: vscode.ExtensionContext) {

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

    // let inputBox=vscode.window.createInputBox();
    // inputBox.value="shuai";
    // inputBox.show();


    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {

        let promiseArray:any[]=[]; 
        promiseArray.push(axiosInstance.get('/v5/stock/realtime/pankou.json?symbol=SH603666'));
        promiseArray.push(axiosInstance.get('/v5/stock/realtime/pankou.json?symbol=SZ002624'));

        Promise.all(promiseArray).then(function(results) {
            let panel=vscode.window.createWebviewPanel("shuai","pankou",vscode.ViewColumn.Active);

            let html:string="";
            for (let response of results) {
                if (response.data["error_code"]===0){
                    html+=JSON.stringify(parseRealTimeInfo(response.data["data"]));
                } else{

                }
            }
            panel.webview.html=html;
            panel.reveal();

        }).catch(function (error){
            vscode.window.showInformationMessage(JSON.stringify(error.response));
        });

    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}