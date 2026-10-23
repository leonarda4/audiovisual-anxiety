import { rolldown } from 'rolldown';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
const root = new URL('./', import.meta.url);
const bundle = await rolldown({input:new URL('source/main.js', root).pathname});
const {output} = await bundle.generate({format:'iife', minify:true});
const template = await readFile(new URL('source/template.html',root),'utf8');
await writeFile(new URL('index.html',root),template.replace('<!-- BUNDLE -->',()=>`<script>${output[0].code.replaceAll('</script', '<\\/script')}</script>`));
await bundle.close();
