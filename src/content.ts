// const injectScript = (filePath: string) => {
//   const script = document.createElement('script');
//   script.src = chrome.runtime.getURL(filePath);
//   script.onload = () => script.remove();
//   (document.head || document.documentElement).appendChild(script);
// };

import { isJson } from './utils/functions';
import { LogPayload } from './utils/types';

// injectScript('/src/injection-script.js');
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
if (root) {
  logsContainer.classList.add('logs-container');
  root.appendChild(logsContainer);
}
window.addEventListener('message', (event) => {
  const message = event.data;
  if (message && message.source === 'console-logger') {
    const data = JSON.parse(message.data);
    const logType = message.type;
    data.forEach((item: any) => {
      const strData = JSON.stringify(item, null, 2);
      const content = isJson(strData) ? strData : item;
      createLogElement({ type: logType, content }).then(
        (logElement: HTMLElement) => {
          logsContainer.appendChild(logElement);
        }
      );
    });
  }
});

async function createLogElement(log: LogPayload) {
  const logElement = document.createElement('div');
  logElement.classList.add('log');
  logElement.innerHTML = `
    <div class="log__header">
      <span class="log__type">${log.type}</span>
    </div>
    <div class="log__content">
      <pre>${log.content}</pre>
    </div>
  `;
  return logElement;
}
