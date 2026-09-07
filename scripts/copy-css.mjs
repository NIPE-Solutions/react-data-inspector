import { copyFile } from 'node:fs/promises'
await copyFile('src/styles.css', 'dist/styles.css')

await copyFile('dist/index.d.ts', 'dist/index.d.cts')
