// include plug-ins
var gulp = require('gulp'),
    less = require('gulp-less');

	gulp.task('less',  function () {
		convertLessToCss();
	});
	function convertLessToCss(){
		 gulp.src('./Content/Common.less').pipe(less()).pipe(gulp.dest('Content'))
	}

gulp.task('watch', function () {
    gulp.watch('./Content/**/*.less', function () {
      convertLessToCss();

    });

});

