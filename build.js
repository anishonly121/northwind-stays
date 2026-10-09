#!/usr/bin/env node
/*
 * Builds the Northwind Stays static site from src/ into docs/.
 *
 *   node build.js
 *
 * Writes two complete builds (docs/v1 = Build 1.0.0, docs/v2 = Build 1.1.0)
 * and the docs/index.html landing page. No dependencies.
 *
 * Source files may contain line directives that select code per build:
 *   //#if v2   ...   //#else   ...   //#endif        (JavaScript)
 *   /*#if v2*\/ ... /*#endif*\/                      (CSS)
 *   <!--#if v2--> ... <!--#endif-->                  (HTML)
 * Directive lines are removed from the output. {{name}} tokens are replaced
 * with partials from src/partials/ or with build values.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'docs');

const BUILDS = [
  { dir: 'v1', version: '1.0.0' },
  { dir: 'v2', version: '1.1.0' }
];

const ASSETS = ['app.js', 'data.js', 'styles.css'];
const DIRECTIVE = /^\s*(?:\/\/|\/\*|<!--)\s*#(if|else|endif)\b\s*([\w-]*)\s*(?:\*\/|-->)?\s*$/;

function selectLines(text, buildDir, label) {
  const out = [];
  const stack = [];
  text.split(/\r?\n/).forEach(function (line, index) {
    const match = DIRECTIVE.exec(line);
    if (match) {
      const keyword = match[1];
      if (keyword === 'if') {
        if (!match[2]) throw new Error(label + ':' + (index + 1) + ' #if needs a build name');
        stack.push({ on: match[2] === buildDir, sawElse: false });
      } else if (keyword === 'else') {
        const top = stack[stack.length - 1];
        if (!top || top.sawElse) throw new Error(label + ':' + (index + 1) + ' unexpected #else');
        top.on = !top.on;
        top.sawElse = true;
      } else {
        if (!stack.length) throw new Error(label + ':' + (index + 1) + ' unexpected #endif');
        stack.pop();
      }
      return;
    }
    if (stack.every(function (entry) { return entry.on; })) out.push(line);
  });
  if (stack.length) throw new Error(label + ': missing #endif');
  return out.join('\n');
}

function loadPartials() {
  const partials = {};
  fs.readdirSync(path.join(SRC, 'partials')).forEach(function (file) {
    partials[path.basename(file, '.html')] = fs.readFileSync(path.join(SRC, 'partials', file), 'utf8').replace(/\s+$/, '');
  });
  return partials;
}

function fillTokens(text, values, label) {
  let result = text;
  for (let pass = 0; pass < 5; pass++) {
    const next = result.replace(/\{\{(\w+)\}\}/g, function (whole, name) {
      if (!Object.prototype.hasOwnProperty.call(values, name)) throw new Error(label + ': unknown token ' + whole);
      return values[name];
    });
    if (next === result) return result;
    result = next;
  }
  return result;
}

function writeFile(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.replace(/\s*$/, '\n'), 'utf8');
}

function clean() {
  BUILDS.forEach(function (build) {
    fs.rmSync(path.join(OUT, build.dir), { recursive: true, force: true });
  });
  fs.rmSync(path.join(OUT, 'index.html'), { force: true });
}

function buildOne(build, partials) {
  const values = Object.assign({}, partials, { version: build.version });
  const target = path.join(OUT, build.dir);
  const pages = fs.readdirSync(path.join(SRC, 'pages')).filter(function (f) { return f.endsWith('.html'); });

  pages.forEach(function (file) {
    const label = 'pages/' + file;
    const source = fs.readFileSync(path.join(SRC, 'pages', file), 'utf8');
    writeFile(path.join(target, file), fillTokens(selectLines(source, build.dir, label), values, label));
  });
  ASSETS.forEach(function (file) {
    const source = fs.readFileSync(path.join(SRC, file), 'utf8');
    writeFile(path.join(target, file), fillTokens(selectLines(source, build.dir, file), values, file));
  });
  return pages.length + ASSETS.length;
}

function buildLanding(partials) {
  const source = fs.readFileSync(path.join(SRC, 'landing.html'), 'utf8');
  writeFile(path.join(OUT, 'index.html'), fillTokens(source, partials, 'landing.html'));
  writeFile(path.join(OUT, '.nojekyll'), '');
}

function checkOutput() {
  const leftovers = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      const text = fs.readFileSync(full, 'utf8');
      if (/\{\{\w+\}\}|#(if|else|endif)\b/.test(text)) leftovers.push(path.relative(ROOT, full));
    });
  })(OUT);
  if (leftovers.length) throw new Error('Unprocessed tokens or directives in: ' + leftovers.join(', '));
}

function main() {
  const partials = loadPartials();
  clean();
  BUILDS.forEach(function (build) {
    const count = buildOne(build, partials);
    console.log('Build ' + build.version + ' -> docs/' + build.dir + '/ (' + count + ' files)');
  });
  buildLanding(partials);
  console.log('Landing page -> docs/index.html');
  checkOutput();
}

main();
