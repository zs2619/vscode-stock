'use strict';

import * as vscode from 'vscode';
import axios from 'axios';
import { isNumber } from 'util';


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

interface IndexInfo{
    symbol:number;
    current:number;
    percent:number;
}

class Stock {

    private inst:any;
    private barItemArray:vscode.StatusBarItem[]=[];

    constructor( ) {
        this.inst= axios.create({
            baseURL: 'https://stock.xueqiu.com',
            timeout: 5000,
            headers:{'Connection': 'keep-alive',
                    'Accept-Encoding': 'gzip, deflate, br',
            },
        });
    }

    public createStatusBarItem(item:IndexInfo) {
        const message = `「${item.symbol}」${item.current} ${item.percent}%`;
        const barItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        barItem.text = message;
        barItem.show();
        return barItem;
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
			const url = `/v5/stock/realtime/pankou.json?symbol=${s}`;
            promiseArray.push(this.inst.get(url));
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
            for (let bar of this.barItemArray){
                bar.dispose();
            }

            for (let response of results) {
                if (response.data["error_code"]===0){
                    let respInfo= response.data["data"][0];
                    const item:IndexInfo={
                            symbol:respInfo["symbol"],
                            current:respInfo["current"],
                            percent:respInfo["percent"],
                    }
                   this.barItemArray.push( this.createStatusBarItem(item));
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