const pkg = require('../package.json')
const banner = `
/* 
  libName: jacky-vite-plugins
  author: jacky
  licensed: MIT
  version: ${pkg.version}
  time: ${new Date().toLocaleDateString()}
*/
`

exports.banner = banner