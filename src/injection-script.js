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
    stack: error ? error.stack : null,
    error: error ? `${error.name}: ${error.message}\n${error.stack}` : null,
    lineContent, // Add the line content here
  };
  sendMessage(errorDetails, 'error-unhandled');
};

(function () {
  const methods = ['log', 'error', 'warn', 'info'];
  methods.forEach((method) => {
    const originalMethod = console[method];
    console[method] = function (...args) {
      const error = new Error();
      const formattedArgs =
        method === 'error'
          ? Array.from(args).map((arg) => {
              if (arg instanceof Error) {
                return `${arg.name}: ${arg.message}\n${arg.stack}`;
              }
              return arg;
            })
          : args;
      const logDetails = {
        type: method,
        message: Array.from(formattedArgs),
        source: getLineContent(error),
      };
      sendMessage(logDetails, method);
      originalMethod.apply(console, args); // Apply the original console method
    };
  });
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

function getLineContent(error) {
  const stack = error.stack.split('\n');
  let lineContent = '';
  if (stack[2]) {
    lineContent = stack[2].trim();
  } else if (stack[1]) {
    lineContent = stack[1].trim();
  }
  return lineContent;
}
