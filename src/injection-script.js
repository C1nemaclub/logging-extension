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

// Override window.onerror to buffer uncaught errors
window.onerror = function (message, source, lineno, colno, error) {
  window.__logBuffer.push({
    type: 'error',
    message,
    source,
    lineno,
    colno,
    error,
  });
};

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
