import { loadEnv } from 'vite'
import type { Plugin } from 'vite'
import fs from 'node:fs'
import { resolve } from 'node:path'

type ICheckVersionIntoHtml = {
  html: string
  version: string
  interval: number
}

const _checkVersionIntoHtml = (param: ICheckVersionIntoHtml) => {
  const { html, version, interval } = param
  const tHtml = html.replace(/(\B)(?=\<\/html\>)/g, ($, $1) => {
    return `<script>
    const _checkVersion = (src) => {
      fetch(src).then((res) => {
        if (!res.ok) {
          if (window.confirm('检测到有版本更新，是否立即刷新？')) {
            location.reload(true)
          }
        }
      })
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        createTimer()
        _checkVersion('version-${version}.js')
      }
    })

    let timer = null
    const createTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        _checkVersion('version-${version}.js')
        createTimer()
      }, ${interval})
    }

    createTimer()
    </script>`
  })

  return tHtml
}

type ICheckVersion = {
  interval?: number
}

export const checkVersion = ({
  interval = 5000,
}: ICheckVersion): Plugin => {
  const viteConfig = {
    root: 'dist',
    mode: 'production',
    curVersion: '0.0'
  }

  return {
    name: 'checkVersion',
    apply: 'build',
    config(config, env) {
      console.log('获取vite配置', config, env)
      viteConfig.root = config.build?.outDir ?? 'dist'
      viteConfig.mode = config.mode ?? 'production'
    },
    buildEnd() {
      console.log('构建结束')
      const { VITE_version } = loadEnv(viteConfig.mode, process.cwd())
      let version = VITE_version
      console.log('当前构建模式', viteConfig.mode)
      console.log('当前版本', VITE_version)
      let envFileName = `.env.${viteConfig.mode}`
      // 判断当前env文件是否存在
      if (!fs.existsSync(resolve(process.cwd(), envFileName))) {
        console.log(`未发现 ${envFileName}, 创建该文件`)
        fs.writeFileSync(resolve(process.cwd(), envFileName), '')
      }

      // 未发现版本号字段, 自动创建该env下字段
      const envFile = fs.readFileSync(resolve(process.cwd(), envFileName), {
        encoding: 'utf-8',
      })
      if (!envFile.includes('VITE_version')) {
        console.log(`未发现 VITE_version 字段, 自动添加该字段`)
        fs.appendFileSync(
          resolve(process.cwd(), envFileName),
          '\nVITE_version = 0.0'
        )
        version = '0.0'
      }
      const curVersion = (+version + 0.1).toFixed(1)
      viteConfig.curVersion = curVersion

      setTimeout(() => {
        const evnFile = fs
          .readFileSync(resolve(process.cwd(), envFileName))
          .toString('utf-8')

        fs.writeFileSync(
          resolve(process.cwd(), `${viteConfig.root}/version-${curVersion}.js`),
          ''
        )
        const newEnv = evnFile.replace(/(?<=VITE_version = )(.+)/, curVersion)
        fs.writeFileSync(resolve(process.cwd(), envFileName), newEnv)
      }, 1000)
    },
    transformIndexHtml(html: string) {
      console.log('添加检查版本更新脚本')
      const tHtml = _checkVersionIntoHtml({
        html,
        version: viteConfig.curVersion,
        interval,
      })

      return tHtml
    },
  }
}
