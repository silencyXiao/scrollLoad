import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import livereload from 'gulp-livereload';
// html页面构建
gulp.task('pages', () => {
  return gulp.src('src/index.html')
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist'))
    .pipe(livereload());
});
// 监控页面修改
gulp.task('watchPages', () => {
  livereload.listen();
  gulp.watch('./src/index.html', ['pages']);
});