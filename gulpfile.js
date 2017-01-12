// include plug-ins
var gulp = require('gulp'),
    less = require('gulp-less');


gulp.task('watch', function () {
    gulp.watch('./Content/**/*.less', function () {
        gulp.src('./Content/Common.less').pipe(less()).pipe(gulp.dest('Content'))

    });

});

