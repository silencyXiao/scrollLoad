import gulp from 'gulp';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import rev from 'gulp-rev';
import revCollector  from 'gulp-rev-collector';
import sourcemaps from 'gulp-sourcemaps';
import livereload from 'gulp-livereload';

gulp.task('scripts', () => {
  return gulp.src('./src/scrollLoad.js')
    .pipe(rev())
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'))
    .pipe(livereload())
    .pipe(rev.manifest({
      path: 'rev-manifest-js.json'
    }))
    .pipe(gulp.dest('./src/rev'));
});

gulp.task('scripts-rev', ['scripts'], () => {
  return gulp.src(['./src/rev/rev-manifest-js.json', './src/*.html'])
    .pipe(revCollector())
    .pipe(gulp.dest('./dist'));
});

// 监控更新脚本修改
gulp.task('watchScripts', () => {
  livereload.listen();
  gulp.watch('./src/scrollLoad.js', ['scripts-rev']);
});