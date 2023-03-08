/* 
  移动端项目中的启动后生成终端二维码，便于真机调试
*/

import type { Plugin } from 'vite'
import type { Level, LevelKey, Size } from './types'
import qrcode from 'qrcode-terminal'
import colors from 'colors'

const levelMap: Record<string, Level> = {
  low: 'L',
  middle: 'M',
  high: 'Q',
  highest: 'H'
}

function scanPreviewPlugin(opts?: {
  size?: Size
  level?: LevelKey
}): Plugin {
  return {
    name: 'scanPreviewPlugin',
    configureServer(server) {
      const printUrls = server.printUrls
      server.printUrls = () => {
        printUrls()
        const { network = [] } = server.resolvedUrls ?? {}
        const networkStand = network[0]
        if (networkStand) {
          console.log(colors.yellow('\nnetwork 预览生成，请扫码预览'))
          const level = opts?.level || 'middle'
          const isLarge = opts?.size === 'large'
          qrcode.setErrorLevel(levelMap[level] ?? 'H')
          qrcode.generate(networkStand, { small: !isLarge })
        } else {
          console.log(colors.red('\n未启用network，请在server中设置host！'))
        }
      }
    },
  }
}

export { scanPreviewPlugin }
