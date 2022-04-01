let project_folder = "dist";
let source_folder = "src";

let path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        svg: project_folder + "/img/svg",
        icons: project_folder + "/icons/",
        fonts: project_folder + "/fonts/",
    },
    src: {
        html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
        css: source_folder + "/scss/style.scss",
        css_libs: source_folder + "/scss/libs/**/*.css",
        js: source_folder + "/js/script.js",
        js_libs: source_folder + "/js/libs/**/*.js",
        img: source_folder + "/img/**/*.{jpg,png,gif,ico,webp}",
        svg: source_folder + "/img/svg/*.svg",
        fonts: source_folder + "/fonts/**/*",
        fontsOptim: source_folder + "/fonts/optim/*.ttf"
    },
    watch: {
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{jpg, png, gif, ico, webp}",
        svg: source_folder + "/img/svg/*.svg",
    },
    clean: "./" + project_folder + "/"
}
let { src, dest } = require("gulp");
let gulp = require("gulp");
let browsersync = require("browser-sync").create();
let fileinclude = require("gulp-file-include");
let del = require("del");
let scss = require("gulp-sass")(require("sass"));
let autoprefixer = require("gulp-autoprefixer");
let group_media = require("gulp-group-css-media-queries");
let clean_css = require("gulp-clean-css");
let rename = require("gulp-rename");
let uglify = require('gulp-uglify-es').default;
let babel = require('gulp-babel');
let imagemin = require('gulp-imagemin');
let webp = require('gulp-webp');
let webphtml = require('gulp-webp-html');
let webpCss = require('gulp-webp-css');
let svgSprite = require('gulp-svg-sprite');
let svgo = require('gulp-svgo');
let ttf2woff = require('gulp-ttf2woff');
let ttf2woff2 = require('gulp-ttf2woff2');
let cheerio = require('gulp-cheerio');

function browserSync() {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/"
        },
        port: 3000,
        notify: false,
    })
}
function html() {
    return src(path.src.html)
        .pipe(fileinclude())
       //.pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream());
}
function js_libs() {
    return src(path.src.js_libs)
        .pipe(dest(path.build.js))
}
function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream());
}
function css_libs() {
    return src(path.src.css_libs)
       .pipe(dest(path.build.css))
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(
            group_media()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 version"],
                cascade: true,
            })
        )
        .pipe(
            webpCss()
        )
        .pipe(dest(path.build.css))
        .pipe(
            clean_css()
        )
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream());
}
function svgImg() {
    return src(path.src.svg)
        .pipe(dest(path.build.svg))
        .pipe(browsersync.stream());
}
function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
               progressive: true,
               svgoPlugins: [{removeViewBox: false}],
               interlaced: true,
               optimizationLevel: 3 
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}
function fontsOptimization() {
    src(path.src.fontsOptim)
        .pipe(dest(path.build.fonts))
        .pipe(src(path.src.fontsOptim))
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fontsOptim)
        .pipe(dest(path.build.fonts))
        .pipe(src(path.src.fontsOptim))
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}
function fonts() {
    return src(path.src.fonts)
        .pipe(dest(path.build.fonts))
}
function createSvgSprite() {
    return src([source_folder + "/iconsprite/*.svg"])
        .pipe(svgo(
            {
                plugins: [
                    {removeTitle: true},
                    {convertColors: {shorthex: false}},
                    {convertPathData: false},
                    {removeStyleElement: true},
                    {inlineStyles: false}
                ]
            }
        ))
        .pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
                $('[class]').removeAttr('class');
                $('[data-name]').removeAttr('data-name');
				$('[style]').removeAttr('style');
			},
			parserOptions: { xmlMode: true }
		}))
        .pipe(
            svgSprite({
                mode: {
                    stack: {
                        sprite: "icons.svg"
                    }
                }
            })
        )
        .pipe(dest(path.build.icons));
}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}
function clean() {
    return del(path.clean);
}

let build = gulp.series(clean, createSvgSprite, gulp.parallel(fontsOptimization, css_libs, js_libs, js, css, html, images, svgImg, fonts));
let watch = gulp.parallel(build, watchFiles, browserSync);

// команды для gulp
// Новые изменения в сборке
exports.createSvgSprite = createSvgSprite;
exports.clean = clean;
exports.fonts = fonts;
exports.fontsOptimization = fontsOptimization;
exports.svgImg = svgImg;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;