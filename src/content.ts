import JSONViewer from './jsonView';
import './jsonView.css';
import './style.css';
import { logTypeColorMap } from './utils/constants';
import { broomIcon, terminalIcon, xIcon } from './utils/icons';
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

function cleanLogs() {
  if (logsContent) {
    logsContent.innerHTML = '';
  }
}

function closeConsole() {
  logsContainer.classList.remove('open');
  chrome.storage.local.set({ isConsoleOpen: false });
}

const root = document.querySelector('body');
const logsContainer = document.createElement('div');
logsContainer.innerHTML = `
<div class="logs__header">
  <div>Logging Console</div>
  <div class="header__icons">
    <div class="icon clean-icon">
      ${broomIcon}
    </div>
    <div class="icon close-icon">
      ${xIcon}
    </div>
  </div>
</div>
<div class="logs__content">
  `;

const cleanIcon = logsContainer.querySelector('.clean-icon');
const closeIcon = logsContainer.querySelector('.close-icon');
cleanIcon?.addEventListener('click', cleanLogs);
closeIcon?.addEventListener('click', closeConsole);

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
      const sourceParts = data.source.split('/').at(-1);
      const [fileName] = sourceParts.split(':');
      const formattedFileName = `${fileName}`;
      data.message.forEach((item: any) => {
        if (typeof item === 'object') {
          createJsonLog({
            type: logType,
            content: item,
            fileName: formattedFileName,
          }).then((logElement) => {
            logsContent?.appendChild(logElement);
            logsContent?.scrollTo({
              top: logsContent.scrollHeight,
            });
          });
          return;
        }
        createLogElement(
          { type: logType, content: item },
          formattedFileName
        ).then((logElement: HTMLElement | undefined) => {
          if (logElement) {
            logsContent?.appendChild(logElement);
            logsContent?.scrollTo({
              top: logsContent.scrollHeight,
            });
          }
        });
      });
      return;
    }

    const { source, lineContent, message: errorMessage } = data;
    if (lineContent.includes('throw error2;')) return;
    const fileName = `${source.split('/').pop()}`;
    createLogElement(
      { type: 'error', content: errorMessage },
      fileName,
      lineContent
    ).then((logElement: HTMLElement | undefined) => {
      if (logElement) {
        logsContent?.appendChild(logElement);
        logsContent?.scrollTo({
          top: logsContent.scrollHeight,
        });
      }
    });
  }
});

async function createLogElement(
  log: LogPayload,
  fileName: string = '',
  snippet: string = ''
) {
  const logElement = document.createElement('div');
  logElement.classList.add('log');
  const bgColor = logTypeColorMap[log.type as keyof typeof logTypeColorMap];
  logElement.style.backgroundColor = bgColor;

  logElement.innerHTML = `
    <div class="log__header">
      <span class="log__fileName">${fileName}</span>
    </div>
    <div class="log__container">
      <pre class="log__content">${log.content}</pre>
      ${snippet ? `<pre class="log__snippet">at: ${snippet.trim()}</pre>` : ''}
    </div>
  `;
  return logElement;
}

async function createJsonLog({
  type,
  content,
  fileName,
}: {
  type: LogType;
  content: any;
  fileName: string;
}) {
  const logElement = document.createElement('div');
  logElement.classList.add('log');
  const bgColor = logTypeColorMap[type as keyof typeof logTypeColorMap];
  logElement.style.backgroundColor = bgColor;

  var jsonViewer = new JSONViewer();
  jsonViewer.showJSON(content, 10, 1);

  // Log Header
  const logHeader = document.createElement('div');
  logHeader.classList.add('log__header');
  const logFileName = document.createElement('span');
  logFileName.classList.add('log__fileName');
  logFileName.textContent = fileName;

  // Log Container
  const logContainer = document.createElement('div');
  logContainer.classList.add('log__container');
  logContainer.appendChild(jsonViewer.getContainer());

  // Append
  logHeader.appendChild(logFileName);
  logElement.appendChild(logHeader);
  logElement.appendChild(logContainer);

  return logElement;
}
