// include plug-ins
var gulp = require('gulp'),
    less = require('gulp-less'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    jsSrc = [
    './bower_components/moment/moment.js',
    './bower_components/angular/angular.js',
    './Scripts/app/app.js',
    './Scripts/app/controllers/*.js',
    './Scripts/app/services/*.js',
    './Scripts/app/constants/*.js',
    './Scripts/app/factories/*.js',
    './Scripts/app/providers/*.js'
];

function convertLessToCss() {
    gulp.src('./Content/Common.less').pipe(less())
        .pipe(concat('build.css'))
        .pipe(gulp.dest('./Build'));
}

function convertJs() {
    return gulp.src(jsSrc)
    .pipe(concat('build.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./Build'));
}


gulp.task('build.less', function () {
    convertLessToCss();
});

gulp.task('watch.less', function () {
    gulp.watch('./Content/**/*.less', function () {
        convertLessToCss();
    });
});


gulp.task('watch.js', function () {
    gulp.watch(jsSrc, function () {
        convertJs();
    });
});
gulp.task('build.js', function () {
    convertJs();
});

