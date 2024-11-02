// This script is always running in the background once the extension is installed.
import config from './config';
import { CphSubmitResponse, CphEmptyResponse } from './types';
import { handleSubmit } from './handleSubmit';
import log from './log';

declare const chrome: any;

const mainLoop = async () => {
    let cphResponse;
    try {
        const headers = new Headers();
        headers.append('cph-submit', 'true');

        const request = new Request(config.cphServerEndpoint.href, {
            method: 'GET',
            headers,
        });

        cphResponse = await fetch(request);
    } catch (err) {
        log('Error while fetching cph response', err);
        return;
    }

    if (!cphResponse.ok) {
        log('Error while fetching cph response', cphResponse);
        return;
    }

    const response: CphSubmitResponse | CphEmptyResponse =
        await cphResponse.json();

    if (response.empty) {
        log('Got empty valid response from CPH');
        
        return;
    }

    log('Got non-empty valid response from CPH');
    handleSubmit(
        response.problemName,
        response.languageId,
        response.sourceCode,
        response.url,
    );
};

setInterval(mainLoop, config.loopTimeOut);

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm: { name: string }) => {
    if (alarm.name === 'keepAlive') {
        console.log('Service worker woke up by alarm');
        mainLoop(); 
    }
});
