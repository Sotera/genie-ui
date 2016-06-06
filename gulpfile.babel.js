import gulp from 'gulp';
import sourceMaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import run from 'gulp-run';
import path from 'path';
//If you get the old ENOSPC on the file watcher run the following at bash command prompt
//echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
const paths = {
  es6: ['./client/app/js/**/*.js'],
  es5: './client/app/build/js',
  // Must be absolute or relative to source map
  sourceRoot: path.join(__dirname, 'client/app/js')
};
gulp.task('copy-env', () => {
  return gulp.src('./script/env.js')
    .pipe(run("sed '/^#/ d'"))//Remove all lines starting with '#' (#!/usr/bin ...)
    .pipe(run('/usr/bin/env node'))//Feed script text to node
    .pipe(gulp.dest(paths.es5));
});
gulp.task('babel', ['copy-env'], () => {
  return gulp.src(paths.es6)
    .pipe(sourceMaps.init())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(sourceMaps.write('.', {sourceRoot: paths.sourceRoot}))
    .pipe(gulp.dest(paths.es5));
});
gulp.task('watch', ['babel'], () => {
  gulp.watch(paths.es6, ['babel']);
});

gulp.task('default', ['watch']);
