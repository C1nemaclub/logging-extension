// // Save first logs
// (function () {
//   console.log('Getting early logs');
//   const logs = [];
//   const log = console.log;
//   console.log = function () {
//     logs.push(Array.from(arguments));
//     log.apply(this, arguments);
//   };
//   var info = console.info;
//   console.info = function () {
//     logs.push(Array.from(arguments));
//     info.apply(this, arguments);
//   };
//   window.postMessage(
//     {
//       source: 'console-logger',
//       data: JSON.stringify(logs),
//     },
//     '*'
//   );
// })();

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
    error.apply(this, arguments);
    sendMessage(Array.from(arguments), 'error');
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
