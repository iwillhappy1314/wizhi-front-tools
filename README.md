
Wizhi 前端工具
===

直接克隆到项目文件夹内，然后安装依赖，运行 `gulp build` 生成前端文件，然后就可以再项目中引用了。

## 安装

- 运行`npm install`安装依赖, 如果需要在多个项目中使用，可以直接创建软链接替代多次安装
- 运行`bower install` 安装前端依赖

## 目录结构

- 前端资源源文件在 `assets` 目录中，可以根据自己需要随意修改，前端资源处理流程基于 [sage](https://github.com/roots/sage)


## 命令
---------------

- `gulp styles`: 编译、合并、优化 Bower CSS 和项目 CSS
- `gulp scripts`: 运行 JSHint 然后编译、合并、优化 Bower JS 和项目 JS
- `gulp fonts`: 收集所有的字体并输出到 fonts 文件夹
- `gulp images`: 无损压缩图像
- `gulp watch`: 监控前端文件修改，并实时同步到浏览器中
- `gulp build`: 构建前端文件， 生成说明文档
- `gulp build --production`: 为生产环境构建前端文件，不会生成 source map
