#!/usr/bin/env node
// Inline source map suppression
const origError = console.error;
console.error = function(...args) {
  for (const arg of args) {
    if (typeof arg === 'string' && arg.includes('sourceMapURL could not be parsed')) {
      return;
    }
  }
  origError.apply(console, args);
};

// Run Next.js dev server
process.argv.push('dev');
require('next/dist/bin/next');



