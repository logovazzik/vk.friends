// include plug-ins
var gulp = require('gulp'),
    less = require('gulp-less'),
	 concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

gulp.task('less', function () {
    convertLessToCss();
});
function convertLessToCss() {
    gulp.src('./Content/Common.less').pipe(less()).pipe(gulp.dest('Content'))
}

gulp.task('watch', function () {
    gulp.watch('./Content/**/*.less', function () {
        convertLessToCss();

    });

});

var jsSrc = [
	'./bower_components/jquery/jquery.js',
	'./bower_components/moment/moment.js',
		 './bower_components/angular/angular.js',
	 './bower_components/underscore/underscore.js',
	 	 './Scripts/app/app.js',
		 './Scripts/app/controllers/*.js',
		 './Scripts/app/services/*.js',
		 './Scripts/app/constants/*.js',
		 './Scripts/app/factories/*.js',
         './Scripts/app/providers/*.js'
];

gulp.task('build.js', function () {
    return gulp.src(jsSrc)
      .pipe(concat('build.js'))
      .pipe(gulp.dest('./Scripts/build'));
});

