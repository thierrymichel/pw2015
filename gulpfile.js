/*jslint indent: 2, nomen: true, node: true, regexp: true, vars: true */
'use strict';


/* ------------------------------------------------------
 * Load modules / packages
 */

var gulp = require('gulp');
var addSrc = require('gulp-add-src');
var autoprefixer = require('gulp-autoprefixer');
var cached = require('gulp-cached');
var changed = require('gulp-changed');
var concat = require('gulp-concat');
var deleted = require('gulp-deleted');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var livereload = require('gulp-livereload');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var sass = require('gulp-ruby-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

var browserify = require('browserify');
var concatenify = require('concatenify');
var exec = require('child_process').exec;
var del = require('del');
var fs = require('fs');
var jsonSass = require('json-sass');
var lazypipe = require('lazypipe');
var assign = require('lodash.assign');
var path = require('path');
var revDel = require('rev-del');
var stringify = require('stringify');
var _ = require('underscore');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');


/* ------------------------------------------------------
 * Settings
 */

var env = process.env.NODE_ENV || 'dev';
// test with build env : $ NODE_ENV=build gulp [taskname]

// src, dest, directories, files, paths, globs, …
var srcDir = 'src/';
var destDir = 'dist/';
var tmpDir = '.tmp/';
var siteFiles = [
    '**/*',
    '!styles{,/**}',        // specific task!
    '!images{,/**}'         // specific task!
  ];
var stylesFiles = 'styles/**/*.scss';
var stylesDir = 'styles/';
var mainFile = 'main';
var imagesDir = 'images/';
var imagesFiles = 'images/**/*';
var breakpointsDir = 'scripts/parts/';
var breakpointsFile = 'breakpoints.json';
var revMainFile = 'rev-manifest.json';
var revFiles = '**/*.+(html|php|jade|info)';
// var staticFiles = '**/*.+(html|php|jade)';


/* ------------------------------------------------------
 * Utils
 */

/**
 * Concatenate string/array of globs with a "base" path
 * Eg: ['baz-*.txt', 'bar/foo.*'] + 'qux/' => ['qux/baz-*.txt', 'qux/bar/foo.*']
 * @param  {String/Array}   path  glob(s)
 * @param  {String}         base  folder/path/
 * @return {String/Array}         glob(s)
 */
function pathConcat(path, base) {
  // preserve !negation for excluded files
  var re = /^(.+)(!)(.+)$/;
  if (typeof path === 'string') {
    return (base + path).replace(re, '$2$1$3');
  }
  return _.map(path, function (item) { return (base + item).replace(re, '$2$1$3'); });
}


/* ------------------------------------------------------
 * Tasks
 */

/*
 * DEFAULT task -> DEV
 */
gulp.task('default', ['dev']);

// gulp.task('dev', ['styles', 'modernizr', 'scripts', 'watch'], function () {
gulp.task('dev', ['copy', 'process:styles', 'process:images', 'watch'], function () {
  console.log('DEV task COMPLETE!');
});


/*
 * WATCH tasks
 * livereload is listening to you…
 */
gulp.task('watch', function () {
  livereload.listen();
  gulp.watch(pathConcat(siteFiles, srcDir), ['copy']);
  gulp.watch(pathConcat(stylesFiles, srcDir), ['process:styles']);
  gulp.watch(pathConcat(imagesFiles, srcDir), ['process:images']);
});


/*
 * CLEAN task
 * Remove 'src' deleted files from 'dest' folder
 */
gulp.task('clean', function () {

  var src = pathConcat(siteFiles, srcDir);

  return gulp
    .src(src)
    .pipe(deleted(destDir, siteFiles, srcDir))
    .pipe(gulpif(
      env === 'dev',
      livereload()
    ));
});


/*
 * COPY task
 * Copy 'dev' files to dist
 * NB: do not removed deleted files (to be improved…)
 */
// gulp.task('copy', ['clean'], function () {
gulp.task('copy', function () {

  var src = pathConcat(siteFiles, srcDir);

  return gulp
    .src(src)
    // .pipe(deleted(destDir, siteFiles, srcDir))
    .pipe(changed(destDir, {hasChanged: changed.compareSha1Digest}))
    .pipe(gulp.dest(destDir))
    .pipe(gulpif(
      env === 'dev',
      livereload()
    ));
});


/*
 * BREAKPOINTS task
 * convert JSON to SASS
 * used for sharing breakpoints between SASS and JS
 */
gulp.task('breakpoints', function () {

  var src = srcDir + breakpointsDir + breakpointsFile;

  return fs.createReadStream(src)
    .pipe(jsonSass({
      prefix: '$mq-breakpoints: ',
      suffix: ';\r'
    }))
    .pipe(source(breakpointsFile))
    .pipe(rename({
      prefix: "_",
      extname: ".scss"
    }))
    .pipe(gulp.dest(srcDir + stylesDir + 'helpers/'));
});


/*
 * STYLES task
 * sass + autoprefixer + livereload + sourcemaps (only in dev mode)
 */
gulp.task('process:styles', ['breakpoints'], function () {

  var src = srcDir + stylesDir + mainFile + '.scss';

  return sass(src, { sourcemap: true, style: 'compressed' })
    .pipe(plumber())
    .pipe(autoprefixer({
      browsers: ['last 2 versions', '> 5%', 'ie >= 9', 'Firefox ESR'],
      cascade: false
    }))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(gulpif(
      env === 'dev',
      sourcemaps.write('./')
    ))
    .pipe(gulpif(
      env === 'dev',
      gulp.dest(destDir + stylesDir),
      gulp.dest(tmpDir + stylesDir)
    ))
    .pipe(gulpif(
      env === 'dev',
      livereload()
    ));
});


/*
 * IMAGES task
 * images optimisation
 * dev mode: only changed images (via cache)
 * build mode: only changed images (via SHA comparison)
 */
gulp.task('process:images', function () {

  var src = srcDir + imagesFiles,
    tmpImg = lazypipe()
      .pipe(deleted, tmpDir, imagesFiles, srcDir)
      .pipe(changed, tmpDir, { hasChanged: changed.compareSha1Digest });

  return gulp
    .src(src, { base: srcDir })
    .pipe(gulpif(
      env === 'dev',
      cached('images'),
      tmpImg()
    ))
    .pipe(imagemin({
      svgoPlugins: [
        {cleanupIDs: false},
        {collapseGroups: false},
        {removeUselessDefs: false}
      ]
    }))
    .pipe(gulpif(
      env === 'dev',
      gulp.dest(destDir),
      gulp.dest(tmpDir)
    ))
    .pipe(gulpif(
      env === 'dev',
      livereload()
    ));
});


/* ------------------------------------------------------
 * BUILD task
 */
// gulp.task('build', ['init-build', 'copy', 'modernizr', 'styles', 'scripts', 'images', 'rev', 'rev-replace'], function () {
gulp.task('build', ['init-build', 'rev-clean', 'rev', 'rev-replace'], function () {
  console.timeEnd('BUILD TIME');
  console.log('BUILD task COMPLETE!');
});


/*
 * INIT_BUILD task
 * set build env
 */
gulp.task('init-build', function () {
  env = 'build';
  console.time('BUILD TIME');
});


/**
 * CLEAN task
 * delete *.min.* files
 * delete images/
 */
gulp.task('rev-clean', ['copy', 'process:styles', 'process:images'], function () {

  var src = [
    destDir + stylesDir + '*.min.css',
    destDir + stylesDir + '*.min.css.map',
    destDir + imagesDir + '**/*'
  ];
  return del(src);
});


/*
 * REV task
 * revision control for main styles and scripts
 */
gulp.task('rev', ['rev-clean'], function () {

  var src = [
    tmpDir + stylesDir + mainFile + '.min.css',
    tmpDir + imagesFiles
  ];

  return gulp
    .src(src, { base: tmpDir })
    .pipe(rev())
    .pipe(gulp.dest(destDir))
    .pipe(rev.manifest(revMainFile))
    .pipe(revDel({ dest: destDir, oldManifest: revMainFile }))
    .pipe(gulp.dest(process.cwd()));
});


/*
 * REV-REPLACE
 * rewrite occurences of main scripts/styles and images (after revision)
 */
gulp.task('rev-replace', ['rev'], function () {

  var manifest = gulp.src(revMainFile),
    src = [
      destDir + stylesDir + '*.css',
      destDir + revFiles
    ];

  return gulp.src(src, { base: destDir })
    .pipe(revReplace({
      manifest: manifest,
      replaceInExtensions: ['.js', '.css', '.html', '.php', '.jade', '.hbs', '.info']
    }))
    .pipe(gulp.dest(destDir));
});
