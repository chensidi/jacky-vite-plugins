const modeConditions = new Map<string, { start: string, end: string }>([
  ['development', {
    start: 'devStart',
    end: 'devEnd',
  }],
  ['canary', {
    start: 'canaryStart',
    end: 'canaryEnd',
  }],
  ['production', {
    start: 'prodStart',
    end: 'prodEnd',
  }],
])

const regMap = new Map<string, RegExp>([
  ['developmentReg', /(\/\* devStart \*\/)(\S|\s)+?(\/\* devEnd \*\/)/g],
  ['canaryReg', /(\/\* canaryStart \*\/)(\S|\s)+?(\/\* canaryEnd \*\/)/g],
  ['productionReg', /(\/\* prodStart \*\/)(\S|\s)+?(\/\* prodEnd \*\/)/g],
])

const regHtmlMap = new Map<string, RegExp>([
  ['developmentReg', /(\<\!\-\- devStart \-\-\>)(\S|\s)+?(\<\!\-\- devEnd \-\-\>)/g],
  ['canaryReg', /(\<\!\-\- canaryStart \-\-\>)(\S|\s)+?(\<\!\-\- canaryEnd \-\-\>)/g],
  ['productionReg', /(\<\!\-\- prodStart \-\-\>)(\S|\s)+?(\<\!\-\- prodEnd \-\-\>)/g],
])

const walkModes = (mode: string, code: string, modeList: string[]) => {
  modeList.forEach(presetMode => {
    if (!modeConditions.get(presetMode)) {
      modeConditions.set(presetMode, {
        start: `${presetMode}Start`,
        end: `${presetMode}End`,
      })
    }
    if (!regMap.get(`${presetMode}Reg`)) {
      regMap.set(`${presetMode}Reg`, new RegExp(`(\\\/\\\* ${presetMode}Start \\\*\\\/)(\\S|\\s)+?(\\/\\* ${presetMode}End \\\*\\\/)`, 'g'))
    }
    if (!regHtmlMap.get(`${presetMode}Reg`)) {
      regHtmlMap.set(`${presetMode}Reg`, new RegExp(`(\<\!-- ${presetMode}Start --\>)(\\S|\\s)+?(\<\!-- ${presetMode}End --\>)`, 'g'))
    }
  })
  const entries = modeConditions.entries()
  for (const [modeName, { start, end }] of entries) {
    const flag = code.includes(start) && code.includes(end)
    if (flag && mode !== modeName) {
      const reg = regMap.get(`${modeName}Reg`)
      const regHtml = regHtmlMap.get(`${modeName}Reg`)
      if (regHtml) {
        code = code.replace(regHtml, ($, $1) => '')
      }
      if (reg) {
        code = code.replace(reg, ($, $1) => '')
      }
    }
  }
  return code
}

export function conditionCompilerPlugin (mode: string, opts?: {
  extensions?: string[]
  include?: string[]
  exclude?: string[]
  presetMode?: string[]
}) {
  return {
    name: 'conditionCompiler',
    transform (code: string, id: string) {
      if (opts?.include) {
        const isInclude = opts.include.find(dir => id.includes(dir))
        if (!isInclude) {
          return
        }
      }
      if (!opts?.include && opts?.exclude) {
        const isExclude = opts.exclude.find(dir => id.includes(dir))
        if (isExclude) {
          return
        }
      }
      let fileTypeReg = /\.(ts|tsx|js|jsx|vue)$/
      if (opts?.extensions) {
        const files = opts.extensions.join('|')
        fileTypeReg = new RegExp(`\\.(${files})$`)
      }
      if (fileTypeReg.test(id)) {
        const modeList = new Set([mode, ...opts?.presetMode || []])
        return walkModes(mode, code, [...modeList])
      }
      return code
    },
  }
}
