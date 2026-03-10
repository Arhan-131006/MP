// suppress Node warnings about unparseable sourceMapURL comments
const origError = console.error;
console.error = function(...args) {
  for (const arg of args) {
    if (typeof arg === 'string' && arg.includes('sourceMapURL could not be parsed')) {
      return;
    }
  }
  origError.apply(console, args);
};
