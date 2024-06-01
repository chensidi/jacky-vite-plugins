# Jacky-Vite-Plugins

关于vite的自定义插件的集合

## 前言

在平时开发过程中，vite是必不可少的构建工具，也是被成为继webpack后的下一代前端构建工具，所以本人根据实际的开发情况和相关经验，从项目出发，编写了一些能够在项目中实用的插件

## 安装

```bash
  yarn add jacky-vite-plugins
  # npm i jacky-vite-plugins
  # pnpm i jacky-vite-plugins
```

## 插件1 - condition-compiler

### 介绍

该插件的灵感来自 uni-app 的条件编译，例如

```ts
// #ifdef MP-WEIXIN
console.log('hello weixin')
// #endif

// #ifndef MP-ALIPAY
console.log('hello other platform')
// #endif
```

这样就能够在不同平台编译出相应需要执行的代码，但是在普通vite项目中，这种功能是需要用另一种方式实现，也就是合理利用环境变量

```ts
if (import.meta.env.mode === 'xxx') {
  // 相关功能.....
}

if (import.meta.env.mode === 'yyy') {
  // 相关代码.....
}

```

这样写可以解决一些问题，但问题也会存在

1. 代码量太多，且比较繁琐
2. 只能在js/ts中执行，html和css中无法使用
3. 环境变量的访问路径稍深，不熟悉的人会有心智负担

所以能否也能像 uni-app 那种写法？

该插件实现了这一需求，使用方式及相关配置如下

### 配置

```ts
  // vite.config.ts
  import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'
  import { conditionCompilerPlugin } from 'jacky-vite-plugins'

  export default defineConfig(({ mode }) => {
    return {
      plugins: [
        conditionCompilerPlugin(mode),
        vue(),
      ],
    }
  })
```

配置解释

在 vite 中 defineConfig 可以是一个对象，也可以传入一个方法，当传入是一个方法时，参数中可以解构出一个 mode，也就是 **模式**，在 package.json 中可以设置不同模式，例如

```json
{
  "script": {
    "dev": "vite --mode dev", // 对应的mode就是dev
    "prod": "vite --mode prod" // 对应mode为prod
    //...依次类推
  }
}
```

当传入的mode被识别后，就可以在项目中去使用条件编译语句了，假如当前启动的mode为dev，如果只想在该环境下才执行的写法如下

```vue
<script lang="ts" setup>
/* devStart */
console.log('dev start') // 此行代码仅在mode为dev环境下执行，其他模式下将被忽略
/* devEnd */
</script>
```

在vite中的mode是由开发者决定的，所以条件编译的前缀，就是你的启动mode，假设启动mode是testxxx，则你在使用条件编译的前缀就是

```ts
/* testxxxStart */
console.log('testxxx start')
/* testxxxEnd */
```

其执行的代码是放在 `/* 前缀Start */` 和 `/* 前缀End */` 之间，当然这是针对ts/js 和 css/scss/less的，如果是html代码中采用条件编译，则需要使用html的注释规范

```html
<!-- 前缀Start -->
<h3>hello world</h3>
<!-- 前缀End -->
```

该插件已经内置了一些mode

+ development(dev)
+ production(prod)
  
当普通启动，或者普通打包时

```bash
yarn dev #启动时mode默认为development
yarn build #打包时mode默认为production
```

所以这两种模式下，无需对 package.json 中的 `script` 下的命令添加额外mode字段，如果需要做自定义mode 字段，则需要手动添加mode的值在script中

### 选项参数

conditionCompilerPlugin 方法还可以有第二个参数，是一个对象，以下是其成员名和用法

1. **presetMode**

    预设模式
    type: string[]
    解释：当我们传入mode给插件时，插件会识别该mode+Start/End注释，并将该注释内的代码作为本次模式下启动执行的依据，但如果同时写了另一种模式的条件编译，那么依然会在任何mode下执行

    ```ts
    /* devStart */
    console.log('dev start') // 仅在mode为dev环境下执行
    /* devEnd */

    /* testStart */
    console.log('dev start') // 本应该在test模式下才会执行，很遗憾，在任何情况下都会执行
    /* testEnd */
    ```

    因为你只告诉了插件去识别dev，但它并不知道test是什么，所以上述第二段代码就仅当成了普通注释，所以在任何条件下都会执行，`presetMode` 解决了这个问题，你可以传入

    ```ts
    {
      presetMode: ['test', 'vsit', 'canary', ...]
    }
    ```

    这样你在项目中写的条件编译就能生效

2. **extensions**

   后缀识别
   type: string[]
   解释：默认情况下，插件会识别项目中所有文件类型，但是如果你指定了文件后置，则仅在该后缀范围内生效，例如

   ```ts
    {
      extensions: ['vue'] // 仅识别vue文件
    }
   ```

3. **exclude**

   排除文件
   type: string[]
   解释：插件默认会识别整个项目文件范围，如果你想排查某些文件

    ```ts
    {
      exclude: ['src'] // 排除src下所有文件
    }
   ```

4. **include**

    指定文件
   type: string[]
   解释：插件默认会识别整个项目文件范围，如果你想指定识别某些文件

    ```ts
    {
      exclude: ['src'] // 仅识别src下所有文件
    }
   ```

   > 当include存在时，exclude不生效

## 插件二 - scan-preview

在移动端H5开发中，很多同学都需要使用真机进行调试，那么在项目启动后，vite终端会打印出一些当前启动的url信息

```bash
  VITE v4.1.4  ready in 327 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.2.168:5173/
```

如果你的手机也在同一个局域网下，那么你可以输入network中的网址，进行真机预览调试，但这样会稍显麻烦，在手机浏览器中打出这一串ip地址，反正个人觉得很烦，那么有没有类似微信小程序或者其他小程序，在编译后生成一张可预览的二维码，直接扫码预览？

这个插件就是干这个事情的！！！

### usage

```ts
// vite.config.ts
// ......
import { scanPreviewPlugin } from 'jacky-vite-plugins'

export default defineConfig({
  plugins: [
    scanPreviewPlugin(),
    vue()
  ]
})
```

然后你的终端就会出现可预览的二维码了

### 参数

scanPreviewPlugin接受一个opts对象作为参数

  1. level， 二维码质量等级，可选值为 'low' | 'middle' | 'high' | 'highest'，顺序由低到高，默认middle
  2. size，二维码大小，可选值为 'large' | 'small'，默认 'small'

> 注意，如果你的 `vite.config.ts` 中的 `server` 字段的 `host` 未设置或设置错误，将无法暴露network给插件，从而无法正常预览!

## 插件三 - check-version

在发版部署过程中，经常遇到代码上线了，但是用户却说没有更新，然后往往就是让他手动刷新页面完成更新，本质原因就是用户察觉不到你的前端代码已经更新，该插件的目的就是自动检测代码更新，并且主动提示用户刷新界面。

### usage

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { checkVersion } from 'jacky-vite-plugins'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    checkVersion()
  ],
})
```

### 参数

checkVersion接受一个opts对象作为参数， 参数如下：
1. interval, 检测版本的时间间隔，默认5000, 意味着每隔5s检测一次，当页面从后台切换到前台时也会检测一次


后续插件正在整理中...
