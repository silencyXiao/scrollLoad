import gulp from 'gulp';
import del from 'del';

gulp.task('clean', () => {
  return del(['dist/js', 'dist/index.html']);
})