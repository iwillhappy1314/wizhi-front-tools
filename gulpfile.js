var argv = require('minimist')(process.argv.slice(2));
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var changed = require('gulp-changed');
var concat = require('gulp-concat');
var flatten = require('gulp-flatten');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var jshint = require('gulp-jshint');
var lazypipe = require('lazypipe');
var merge = require('merge-stream');
var cssNano = require('gulp-cssnano');
var plumber = require('gulp-plumber');
var rev = require('gulp-rev');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
//var uglify = require('gulp-uglify-es').default;
//var babel = require('gulp-babel');

/**
 * 资源说明文件路径
 */
var manifest = require('asset-builder')('./assets/manifest.json');


/**
 * 资源说明文件里面定义的路径
 */
var path = manifest.paths;

/**
 * 资源说明文件配置， 在这里设置自定义选项
 */
var config = manifest.config || {};


/**
 * 全局资源
 */
var globs = manifest.globs;


/**
 * 全局资源
 */
var project = manifest.getProjectGlobs();


/**
 * 编译时的选项
 */
var enabled = {
    rev          : argv.production,
    maps         : !argv.production,
    failStyleTask: argv.production,
    failJSHint   : argv.production,
    stripJSDebug : argv.production
};


/**
 * dist 目录中的版本说明文件
 */
var revManifest = path.dist + 'assets.json';

/**
 * CSS 处理管道
 */
var cssTasks = function (filename) {
    return lazypipe()
        .pipe(function () {
            return gulpif(!enabled.failStyleTask, plumber());
        })
        .pipe(function () {
            return gulpif(enabled.maps, sourcemaps.init());
        })
        .pipe(function () {
            return gulpif('*.scss', sass({
                outputStyle    : 'nested', // libsass doesn't support expanded yet
                precision      : 10,
                includePaths   : ['.'],
                errLogToConsole: !enabled.failStyleTask
            }));
        })
        .pipe(concat, filename)
        .pipe(autoprefixer)
        .pipe(function () {
            return gulpif(enabled.rev, cssNano({safe: true}));
        })
        .pipe(function () {
            return gulpif(enabled.rev, rev());
        })
        .pipe(function () {
            return gulpif(enabled.maps, sourcemaps.write('.', {
                sourceRoot: 'assets/styles/'
            }));
        })();
};

/**
 * JS 处理管道
 */
var jsTasks = function (filename) {
    return lazypipe()
        .pipe(function () {
            return gulpif(enabled.maps, sourcemaps.init());
        })
        .pipe(concat, filename)
        //.pipe(function () {
        //  return babel({
        //    presets: ['env']
        //  });
        //})
        //.pipe(uglify, {
        //    compress: {
        //        'drop_debugger': enabled.stripJSDebug
        //    }
        //})
        .pipe(function () {
            return gulpif(enabled.rev, rev());
        })
        .pipe(function () {
            return gulpif(enabled.maps, sourcemaps.write('.', {
                sourceRoot: 'assets/scripts/'
            }));
        })();
};


/**
 * 写入到版本说明
 */
var writeToManifest = function (directory) {
    return lazypipe()
        .pipe(gulp.dest, path.dist + directory)
        .pipe(browserSync.stream, {match: '**/*.{js,css}'})
        .pipe(rev.manifest, revManifest, {
            base : path.dist,
            merge: true
        })
        .pipe(gulp.dest, path.dist)();
};


/**
 * 自动注入 Less 和 Sass bower 依赖
 */
gulp.task('wiredep', gulp.series(async() => {
  var wiredep = require('wiredep').stream;
  return gulp.src(project.css)
              .pipe(wiredep())
              .pipe(changed(path.source + 'styles'))
              .pipe(gulp.dest(path.source + 'styles'));
}));


/**
 * 编译、合并、优化 Bower CSS 和项目 CSS
 */
gulp.task('styles',  gulp.series('wiredep', async() => {
    var merged = merge();
    manifest.forEachDependency('css', function (dep) {
        var cssTasksInstance = cssTasks(dep.name);
        if (!enabled.failStyleTask) {
            cssTasksInstance.on('error', function (err) {
                console.error(err.message);
                this.emit('end');
            });
        }
        merged.add(gulp.src(dep.globs, {base: 'styles'})
                       .pipe(cssTasksInstance));
    });
    return merged
        .pipe(writeToManifest('styles'));
}));


/**
 * 运行 JSHint 然后编译、合并、优化 Bower JS 和项目 JS
 */
//gulp.task('scripts', ['jshint'], function () {
gulp.task('scripts', gulp.series(async() => {
    var merged = merge();
    manifest.forEachDependency('js', function (dep) {
        merged.add(gulp.src(dep.globs, {base: 'scripts'})
                       .pipe(jsTasks(dep.name)));
    });
    return merged
        .pipe(writeToManifest('scripts'));
}));

/**
 * 收集所有的字体并输出到 fonts 文件夹
 */
gulp.task('fonts', gulp.series(async() => {
    return gulp.src(globs.fonts)
               .pipe(flatten())
               .pipe(gulp.dest(path.dist + 'fonts'))
               .pipe(browserSync.stream());
}));


/**
 * 无损压缩图像
 */
gulp.task('images', gulp.series(async() => {
    return gulp.src(globs.images)
               .pipe(imagemin({
                   progressive: true,
                   interlaced : true,
                   svgoPlugins: [{removeUnknownsAndDefaults: false},
                       {cleanupIDs: false}]
               }))
               .pipe(gulp.dest(path.dist + 'images'))
               .pipe(browserSync.stream());
}));


/**
 * JSHint 任务
 */
gulp.task('jshint', gulp.series(async() => {
    return gulp.src(['bower.json',
        'gulpfile.js'].concat(project.js))
               .pipe(jshint())
               .pipe(jshint.reporter('jshint-stylish'))
               .pipe(gulpif(enabled.failJSHint, jshint.reporter('fail')));
}));


/**
 * 清理编译文件夹
 */
gulp.task('clean', gulp.series(async() =>{
  require('del').bind(null, [path.dist])
}));


/**
 * 监控前端资源改变， 使用 BrowserSync 自动同步
 */
gulp.task('watch', gulp.parallel(function () {
    browserSync.init({
        files         : [
            '{lib,templates}/**/*.php',
            '*.php'
        ],
        proxy         : config.devUrl,
        snippetOptions: {
            whitelist: ['/wp-admin/admin-ajax.php'],
            blacklist: ['/wp-admin/**']
        }
    });
    gulp.watch([path.source + 'styles/**/*'], gulp.series('styles'));
    gulp.watch([path.source + 'scripts/**/*'], gulp.series('jshint', 'scripts'));
    gulp.watch([path.source + 'fonts/**/*'], gulp.series('fonts'));
    gulp.watch([path.source + 'images/**/*'], gulp.series('images'));
    gulp.watch(['bower.json', 'assets/manifest.json'], gulp.series('build'));
}));


/**
 * 编译所有资源
 */
gulp.task('build', gulp.parallel('styles', 'scripts', 'fonts',
  'images', gulp.series(function(callback) {
      callback();
    })));


/**
 * 默认使用， 进行完整编译， 为生产环境编译使用 `gulp --production`
 */
gulp.task('default', gulp.series('clean', function () {
    gulp.start('build');
}));
