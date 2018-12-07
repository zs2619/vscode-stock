'use strict';

import * as vscode from 'vscode';
import axios from 'axios';
import { isNumber, isUndefined } from 'util';


// interface Record{
//     price:number;
//     amount:number;
// }
// interface StockRealTimeInfo {
//     symbol:string;
//     timeStamp:number;
//     current:number;
//     // sellRecord:Record[];
//     // buyRecord:Record[];
// }


interface QuoteInfo{
    symbol:number;
    current:number;
    percent:number;
    avg_price:number;
    high:number;
    low:number;
}
function parseRealTimeInfo(response:any) {
    let quote:QuoteInfo={
        symbol:response["symbol"],
        current:response["current"],
        percent:response["percent"],
        avg_price:response["avg_price"],
        high:response["high"],
        low:response["low"],
    };
    return quote;
}

class Stock {

    private inst:any;
    private barItemArray:Map<number,vscode.StatusBarItem>=new Map<number,vscode.StatusBarItem>();
    private webviewPanel:vscode.WebviewPanel|null=null;
    private pankouPollTime:NodeJS.Timer|null=null;

    constructor( ) {
        this.inst= axios.create({
            baseURL: 'https://stock.xueqiu.com',
            timeout: 5000,
            headers:{'Connection': 'keep-alive',
                    'Accept-Encoding': 'gzip, deflate, br',
            },
        });
    }

    public updateStatusBarItem(item:QuoteInfo) {
        const message = `「${item.symbol}」${item.current} ${item.percent}%`;
        let barItem= this.barItemArray.get(item.symbol);
        if (isUndefined(barItem)){
            const newBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            newBarItem.text = message;
            this.barItemArray.set(item.symbol,newBarItem);
            newBarItem.show();
        } else {
            barItem.text = message;
            barItem.show();
        }
    }
    public updateStocksPankouInfo():void{

        const config = vscode.workspace.getConfiguration();
        const stocks = config.get<string[]>('stock.stocks');

        if (!Array.isArray(stocks)) {
            vscode.window.showInformationMessage('config setting stocks error');
            return ;
        }

        let promiseArray:any[]=[]; 
        for ( let s of stocks) {
			const url = `/v5/stock/realtime/quotec.json?symbol=${s}`;
            promiseArray.push(this.inst.get(url));
        }

        Promise.all(promiseArray).then((results)=>{
            if (this.webviewPanel===null)
            {
                this.webviewPanel=vscode.window.createWebviewPanel("shuai","quotec",vscode.ViewColumn.Active);
                this.webviewPanel.onDidDispose((event)=>{
                    this.webviewPanel=null;
                    if (this.pankouPollTime!==null){
                        clearInterval(this.pankouPollTime);
                    }
                });

                const pollTime = config.get<number>('stock.pankouPollTime');
                if (isNumber(pollTime)){
                    this.pankouPollTime=setInterval(()=>{
                        this.updateStocksPankouInfo();
                    },pollTime*1000);
                }
            }

            let html:string="";
            for (let response of results) {
                if (response.data["error_code"]===0){
                    html+=JSON.stringify(parseRealTimeInfo(response.data["data"][0]));
                } else{

                }
            }
            this.webviewPanel.webview.html=html;
            this.webviewPanel.reveal();
        }).catch(function (error){
            vscode.window.showInformationMessage(JSON.stringify(error.response));
        });
    }

    public updateIndexInfo():void{
        const config = vscode.workspace.getConfiguration();
        const indexs = config.get<string[]>('stock.indexs');

        if (!Array.isArray(indexs)) {
            vscode.window.showInformationMessage('config setting stocks error');
            return ;
        }

        let promiseArray:any[]=[]; 
        for ( let s of indexs) {
			const url = `/v5/stock/realtime/quotec.json?symbol=${s}`;
            promiseArray.push(this.inst.get(url));
        }

        Promise.all(promiseArray).then((results)=> {
            for (let response of results) {
                if (response.data["error_code"]===0){
                    let respInfo= response.data["data"][0];
                    const item:QuoteInfo= parseRealTimeInfo(respInfo);
                    this.updateStatusBarItem(item);
                }
            }

        }).catch(function (error){
            vscode.window.showInformationMessage(JSON.stringify(error.response));
        });
    }
}

export function activate(context: vscode.ExtensionContext) {

    let stock = new Stock();

    const config = vscode.workspace.getConfiguration();
    const pollTime = config.get<number>('stock.indexPollTime');
    if (isNumber(pollTime)){
        setInterval(()=>{
            stock.updateIndexInfo();
        },pollTime*1000);
    }

    let barItem=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,-100);
    barItem.text="XQ";
    barItem.command="extension.createWebview";
    barItem.show();

    let disposable = vscode.commands.registerCommand('extension.createWebview', () => {
        stock.updateStocksPankouInfo();
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(barItem);
}

// this method is called when your extension is deactivated
export function deactivate() {
}