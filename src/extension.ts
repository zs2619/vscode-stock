'use strict';

import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import axios from 'axios';


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
interface StockConfigFile{
    stock:string[];
    index:string[];
    indexPollTime:number;
    pankouPollTime:number;
}
const defaultStockConfigFile:StockConfigFile={stock:["SH603666", "SZ002624" ,"SZ002371"],index:["SZ399006"],indexPollTime:10,pankouPollTime:10};
const defaultFileName='stock.json';
let   FullPath:string ;

let stockConfigFile:StockConfigFile;

async function createDefaultConfig(currPath:string) {

    const stockConfigFile = path.join(currPath, defaultFileName);

    fs.writeFileSync(stockConfigFile,JSON.stringify(defaultStockConfigFile));
    let document = await vscode.workspace.openTextDocument(stockConfigFile);
    vscode.window.showTextDocument(document);
}

function loadConfig(currPath:string) {
    const stockConfigFile = path.join(currPath, defaultFileName);

    if (!fs.existsSync(stockConfigFile)) {
        createDefaultConfig(currPath);
    }
    let cfgObj: StockConfigFile;
    let buf=fs.readFileSync(stockConfigFile );
    cfgObj= JSON.parse(buf.toString()) as StockConfigFile;
    return cfgObj;
}


export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "stock" is now active!');
    FullPath= path.join(context.extensionPath, defaultFileName);

    const axiosInstance = axios.create({
    baseURL: 'https://stock.xueqiu.com',
    timeout: 5000,
    headers:{'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate, br',
    },
    });

    stockConfigFile= loadConfig(context.extensionPath);

    setInterval(()=>{
        vscode.window.setStatusBarMessage("shuai");
    },10*1000);

    let barItem=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,-100);
    barItem.text="XQ";
    barItem.command="extension.sayHello";
    barItem.show();

    // let inputBox=vscode.window.createInputBox();
    // inputBox.value="shuai";
    // inputBox.show();
    vscode.workspace.onDidSaveTextDocument((event)=>{
        if (event.fileName===FullPath){
            stockConfigFile= loadConfig(context.extensionPath);
        }
    });

    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {

        let promiseArray:any[]=[]; 
        for ( let s of stockConfigFile.stock) {
			const url = `/v5/stock/realtime/pankou.json?symbol=${s}`;
            promiseArray.push(axiosInstance.get(url));
        }
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