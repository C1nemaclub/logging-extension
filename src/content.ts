const injectScript = (filePath: string) => {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(filePath);
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
};
injectScript('/src/injection-script.js');

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message && message.source === 'console-logger') {
    const data = JSON.parse(message.data);
    console.log(data);
  }

  //   const data = isJson(JSON.parse(event.data))
  //     ? JSON.parse(event.data)
  //     : event.data;
  //   console.log(data);
});
