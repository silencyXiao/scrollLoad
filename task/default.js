import gulp from 'gulp';
import gulpSequence from 'gulp-sequence';

gulp.task('default', gulpSequence('clean', 'scripts', 'pages', 'scripts-rev', 'watchScripts', 'watchPages'));