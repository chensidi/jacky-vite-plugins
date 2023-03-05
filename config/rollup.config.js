const { resolve } = require('path')
const { babel } = require('@rollup/plugin-babel')
const typescript = require('@rollup/plugin-typescript')
const terser = require('@rollup/plugin-terser')
const { banner } = require('./rollup')
const clear = require('rollup-plugin-clear')

module.exports = [
  {
    input: resolve(__dirname, '../src/index.ts'),
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      banner,
    },
    plugins: [
      typescript(),
      babel({
        presets: ['@babel/preset-env'],
        exclude: 'node_modules/**',
      }),
      process.env.NODE_ENV === 'production' ? terser({
        
      }) : undefined,
      clear({
        targets: ['dist']
      }),
    ],
  },
  {
    input: resolve(__dirname, '../src/index.ts'),
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      banner,
    },
    plugins: [
      typescript(),
      babel({
        presets: ['@babel/preset-env'],
        exclude: 'node_modules/**',
      }),
      process.env.NODE_ENV === 'production' ? terser() : undefined,
      clear({
        targets: ['dist']
      }),
    ],
  }
]
