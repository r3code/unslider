'use strict';

/* for more info see 
* Настройка сборки GULP https://css-tricks.com/gulp-for-beginners/
* Сборка HTML шаблонов из частей http://analyticl.com/blog/frontend-templating-with-gulp-and-twig-js
  
*/
var 
    gulp           = require('gulp'),
    runSequence    = require('run-sequence'),  
    changed        = require('gulp-changed'),
    gulpif         = require('gulp-if'),
		flog           = require('fancy-log' ),
		sass           = require('gulp-sass'),  
		browsersync    = require('browser-sync'),
		uglify         = require('gulp-uglify'),
		cleanCSS       = require('gulp-clean-css'),
		rename         = require('gulp-rename'),
		del            = require('del'),
		cache          = require('gulp-cache'),
		autoprefixer   = require('gulp-autoprefixer'),
		notify         = require("gulp-notify"),  
    sourcemaps     = require('gulp-sourcemaps'),
    stylelint       = require('gulp-sass-lint')
    ;    
             
const srcDir = './src';
const distDir = './dist'; 

var config = {  
  browsersync: {
    baseDir: distDir 
  },
  buildhtml: { 
    watchSrc: srcDir +  '/*.html',
    src: srcDir +  '/*.html', // recursive /**/*.html
    dest: distDir 
  },  
  styles: {
    src: srcDir + '/scss/*.s+(a|c)ss',
    dest: distDir + '/css',
    options: {
      outputStyle: 'expand', 
      includePaths: []
    }
  },
  js: {
    src: [
      srcDir + '/js/*.js'
    ],
    dest: distDir + '/js'
  },
  jslibs: {
    src: [
      'node_modules/jquery/dist/jquery.min.js'
    ],
    dest: distDir + '/js' 
  },
  stylelint: {
    src: [
      srcDir +  '/scss/**/*.s+(a|c)ss', 
//    exclude some files from LINT  
      '!' + srcDir +  '/scss/base/_sprites.scss',
      '!' + srcDir +  '/scss/helpers/_meyer-reset.scss'
      ]
  },  
};    
    
/* 
 * Задачи применяемые в процессе разработки
 */      

// Наблюдать за изменением файлов и вызывать слудующие задачи
gulp.task('watch', function() {   
  runSequence(  
    [        
      'build-styles',
      'stylelint',   
      'copy-html',
      'copy-js-libs', 
      'minify-js',
    ],    
    'browser-sync') 
    // [что смотрим], [имена, задач]
    // или [что смотрим], функция без скобок ()     
    gulp.watch(config.styles.src, ['build-styles', 'stylelint']);
    gulp.watch(config.js.src, function (done) { 
        // ensure that task finished then reload
        browsersync.reload();
        // ??? why was here -> done();
    });
    gulp.watch(config.buildhtml.src, ['copy-html']);
    gulp.watch(config.buildhtml.dest, browsersync.reload);
  }
);            

                   
// перезагрузка страницы в браузере 
gulp.task('browser-sync', function() {     
  // see https://github.com/kogakure/gulp-tutorial/blob/master/gulp/config.js
	browsersync({
		server: {
			baseDir: config.browsersync.baseDir
		},              
    // показывать ли визуальное уведомление на странице о от(под)ключении к browser-sync
		notify: false,
    // Выставить наружу через сервис localtunnel.me  
		// tunnel: true,
		// tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
	});
}); 
           
/**
 * Lint SCSS files
 * `gem install scss-lint` needed
 */
gulp.task('stylelint', function() {
  return gulp.src(config.stylelint.src)
    .pipe(stylelint(config.stylelint.options)
      .on("error", notify.onError())
    )
    .pipe(stylelint.format())
    .pipe(stylelint.failOnError());
});
      

// Компилировать SASS (синтаксис без скобок {} блоки отступами заданы)
gulp.task('build-styles', function() { 
  browsersync.notify('Transforming CSS with SASS'); 
  
	return gulp.src(config.styles.src) 
	.pipe(sass(config.styles.options)
    .on("error", notify.onError())
  )  
  // сменим имя на .min.css в разработке там несжатый развернутый CSS
	.pipe(rename({suffix: '.min', prefix : ''}))   
	.pipe(autoprefixer(['last 15 versions']))   
  .pipe(sourcemaps.init())   
    .pipe(sourcemaps.write())   
	.pipe(gulp.dest(config.styles.dest)) 
//  .pipe(changed(config.styles.dest, {extension: '.css'})) 
	.pipe(browsersync.stream({match: '**/*.css'}))
  .pipe(notify({ message: 'build-styles task complete' }));   
  browsersync.notify('Upload new CSS');
});


gulp.task('copy-html', function () {
  return gulp.src(config.buildhtml.src)
      .pipe( changed(config.buildhtml.dest) ) 
      .pipe( gulp.dest(config.buildhtml.dest) )
      .pipe( notify({ message: 'copy-html task complete' }) );
});

gulp.task('copy-js-libs', function () {
  return gulp.src(config.jslibs.src)    
      .pipe( changed(config.jslibs.dest) ) 
      .pipe( gulp.dest(config.jslibs.dest) )
      .pipe( notify({ message: 'copy-js-libs task complete' }) );
});


     
// Сжатие итогового js файла
gulp.task('minify-js', function() {
  return gulp.src(config.js.src)
    .pipe(rename({suffix: '.min', prefix : ''}))
	  .pipe(uglify().on('error', function(err) {
      flog.error(err.toString());
      this.emit('end');
      })) // Минимизировать весь js
    .pipe( changed(config.js.dest) ) 
    .pipe( gulp.dest(config.js.dest) )
    .pipe( notify({ message: 'minify-js task complete' }) ); 
});
     
                
// Сжать CSS файлы
gulp.task('minify-css',() => {
  return gulp.src(consf.styles.dest)  
    .pipe(cleanCSS())
    .pipe(gulp.dest(consf.styles.dest));
});
         
// Собрать готовый дистрибутив всех файлов
gulp.task('build-dist', function(callback) {   
  runSequence(
    'remove-dist',
    'clear-cache',  
    'build-styles',
      [        
        'minify-css',         
        'minify-js',
        'copy-js-libs',
        'copy-html' 
      ]     
    );          
});
     

gulp.task('remove-dist', function() { return del.sync(distDir); });
gulp.task('clear-cache', function () { return cache.clearAll(); });  

gulp.task('default', ['watch']);
