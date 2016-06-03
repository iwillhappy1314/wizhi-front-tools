Wizhi 前端文档工具
===

基于 [Harp](http://harpjs.com/) 的前端文章构建工具

- 运行`npm install`安装依赖
- 运行`bower install` 安装前端依赖
- 运行`gulp watch` 监控前端资源和说明文档修改

### 目录结构

- 前端资源源文件在 `assets` 目录中，可以根据自己需要随意修改，前端资源处理流程基于 [sage](https://github.com/roots/sage)
- 生成后的前端资源文件在 dist 目录中，同时会复制一份到 `docs/www/dist` 中，以便在发布文档时访问。
- 文档源文件在 `docs/public` 中，全部是 jade 模板，需要编译后才能访问
- 发布文档前，请修改 `harp.json` 中的 `uri` 为你准备使用的文档网址


其他命令
---------------

- `gulp build`: 构建前端文件， 生成说明文档
- `gulp build --production`: 为生产环境构建前端文件，不会生成 source map
- `gulp deploy`: 发布文档目录到 Github Pages

