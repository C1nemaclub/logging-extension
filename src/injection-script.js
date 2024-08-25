// Create a log buffer
window.__logBuffer = [];

// Override console.log to buffer logs
(function () {
  const originalLog = console.log;
  console.log = function (...args) {
    window.__logBuffer.push({ type: 'log', args });
    originalLog.apply(console, args);
  };
})();

// Fetch source code to get specific line content
function fetchLineContent(source, lineno) {
  return fetch(source)
    .then((response) => response.text())
    .then((text) => {
      const lines = text.split('\n');
      return lines[lineno - 1] || 'Line content not found';
    })
    .catch((error) => `Failed to fetch source: ${error.message}`);
}

// Override window.onerror to buffer uncaught errors
window.onerror = async function (message, source, lineno, colno, error) {
  const lineContent = await fetchLineContent(source, lineno);
  const errorDetails = {
    type: 'error',
    message,
    source,
    lineno,
    colno,
    error: error ? `${error.name}: ${error.message}\n${error.stack}` : null,
    lineContent, // Add the line content here
  };
  window.__logBuffer.push(errorDetails);
  sendMessage(errorDetails, 'error-unhandled');
};

window.addEventListener('unhandledrejection', async function (event) {
  const lineContent =
    event.reason && event.reason.stack
      ? await fetchLineContent(
          event.reason.stack.split('\n')[1].split('(')[1].split(':')[0],
          event.reason.stack.split(':')[1]
        )
      : 'Line content not available';
  const errorDetails = {
    type: 'error',
    message: event.reason ? event.reason.message : 'Unhandled Rejection',
    source: 'Promise',
    lineno: null,
    colno: null,
    lineContent, // Add the line content here
    error: event.reason
      ? `${event.reason.name}: ${event.reason.message}\n${event.reason.stack}`
      : null,
  };
  window.__logBuffer.push(errorDetails);
  sendMessage(errorDetails, 'error-unhandled');
});

// Function to send buffered logs after injection
function sendBufferedLogs() {
  if (window.__logBuffer.length > 0) {
    window.__logBuffer.forEach((log) => {
      sendMessage(log.args, log.type);
      // Send log to your server or handle it as needed
      // e.g., sendLog(log)
    });
    // Clear the buffer
    window.__logBuffer = [];
  }
}
// Call this function after your main script loads
sendBufferedLogs();

(function () {
  const log = console.log;
  console.log = function () {
    log.apply(this, arguments);
    sendMessage(Array.from(arguments), 'log');
  };
  var info = console.info;
  console.info = function () {
    info.apply(this, arguments);
    sendMessage(Array.from(arguments), 'info');
  };
  var error = console.error;
  console.error = function () {
    const formattedArgs = Array.from(arguments).map((arg) => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack}`;
      }
      return arg;
    });
    error.apply(this, formattedArgs);
    sendMessage(formattedArgs, 'error');
  };
  var warn = console.warn;
  console.warn = function () {
    warn.apply(this, arguments);
    sendMessage(Array.from(arguments), 'warn');
  };
})();

function sendMessage(message, type) {
  window.postMessage(
    {
      source: 'console-logger',
      data: JSON.stringify(message),
      type,
    },
    '*'
  );
}
