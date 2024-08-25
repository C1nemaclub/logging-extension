import './style.css';
import { logTypeColorMap } from './utils/constants';
import { isJson } from './utils/functions';
import { terminalIcon } from './utils/icons';
import { LogPayload, LogType } from './utils/types';

const injectScript = (filePath: string) => {
  const script = document.createElement('script');

  script.src = chrome.runtime.getURL(filePath);
  script.async = false;
  script.defer = true;
  script.onload = () => script.remove();
  if (document.head) {
    document.head.prepend(script);
  } else if (document.documentElement) {
    document.documentElement.prepend(script);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.head.prepend(script);
    });
  }
};

injectScript('/src/injection-script.js');

const root = document.querySelector('body');
const logsContainer = document.createElement('div');
logsContainer.innerHTML = `
<div class="logs__header">
  <h1>Logging Console</h1>
</div>
<div class="logs__content">
  `;
const logsContent = logsContainer.querySelector('.logs__content');
if (root) {
  logsContainer.classList.add('logs__console');
  chrome.storage.local.get(['isConsoleOpen'], function (result) {
    if (result.isConsoleOpen) {
      logsContainer.classList.add('open');
    }
  });
  const bubbleButton = document.createElement('div');
  bubbleButton.classList.add('bubble-button');
  bubbleButton.innerHTML = `
      ${terminalIcon}
      `;
  bubbleButton.addEventListener('click', () => {
    const value = logsContainer.classList.toggle('open');
    chrome.storage.local.set({ isConsoleOpen: value });
  });
  root.appendChild(logsContainer);
  root.appendChild(bubbleButton);
}

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message && message.source === 'console-logger') {
    const data = JSON.parse(message.data);
    const logType = message.type as LogType;
    if (logType !== 'error-unhandled') {
      data.forEach((item: any) => {
        const strData = JSON.stringify(item, null, 2);
        const content = isJson(strData) ? strData : item;
        createLogElement({ type: logType, content }).then(
          (logElement: HTMLElement) => {
            logsContent?.appendChild(logElement);
            logsContent?.scrollTo({
              top: logsContent.scrollHeight,
            });
          }
        );
      });
      return;
    }
    const errorMessage = data.message;
    createLogElement({ type: 'error', content: errorMessage }).then(
      (logElement: HTMLElement) => {
        logsContent?.appendChild(logElement);
        logsContent?.scrollTo({
          top: logsContent.scrollHeight,
        });
      }
    );
  }
});

async function createLogElement(log: LogPayload) {
  const logElement = document.createElement('div');
  logElement.classList.add('log');
  const bgColor = logTypeColorMap[log.type as keyof typeof logTypeColorMap];
  logElement.innerHTML = `
    <div class="log__header"
      style="background-color: ${bgColor}"
      >
      <span class="log__type">${log.type}</span>
    </div>
    <div class="log__content">
      <pre>${log.content}</pre>
    </div>
  `;
  return logElement;
}
