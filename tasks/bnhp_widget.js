/*
 * grunt-bnhp-widget
 * https://github.com/Ido/grunt-bnhp-widget
 *
 * Copyright (c) 2014 Ido Lempert
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
    var SLASH_CHAR = '/';
    var getWidgetName = function(path){
        if (path.length <= 2) return null;

        //var isLastChartSlash = (a.charAt(a.length -1) == SLASH_CHAR) ? true : false;
        var name = path.substr(path.lastIndexOf(SLASH_CHAR, path.length -2));

        var lastIndex = name.length;
        if (name.charAt(name.length -1)  == SLASH_CHAR ) {
            lastIndex--;
        }

        return name.substring(1, lastIndex); //remove slash;
    };


    grunt.registerMultiTask('bnhp_widget_create_html', 'Create Backbase widget index.html.', function(){
        var name = this.data.options.name;
        if (!name) return;

        var indexHtmlPath = this.data.src;

        var content = '';
        if (grunt.file.exists(indexHtmlPath)){
            content = grunt.file.read(indexHtmlPath);

            //TODO: check if script have src
            //remove all script and link tags
            var scripts = content.match(/(<script.+?><\/script>|<link.+?\/>)/g);
            if (scripts){
                scripts.forEach(function(m){
                    if (! /src=".+?\/.+?"/.test(m) && ! /href=".+?\/.+?"/.test(m)){
                        content = content.replace(m, '');
                    }
                });
            }

            //content = content.replace(/(<script.+?><\/script>|<link.+?\/>)/g, '');
        } else {
            content = [
                '<!DOCTYPE html>',
                '<html>',
                '<head>',
                '</head>',
                '<body>',
                '   <' + name + '></' + name + '>',
                '</body>',
                '</html>'
            ].join("\n");
        }

        var headEndTagIndex = content.indexOf('<\/head>');

        var t = content.substr(0, headEndTagIndex);
        t += '<link rel="stylesheet" href="main.min.css"/>' + "\n";
        t += '<script type="text/javascript" src="main.min.js"></script>' + "\n";
        t += content.substr(headEndTagIndex);

        content = t;
        grunt.file.write(this.data.dest, content);
    });

    grunt.registerMultiTask('bnhp_widget', 'Create Backbase widget for PRODUCTION.', function() {
        var templatesUrl = this.data.options.templatesUrl ? this.data.options.templatesUrl : function(url){return url;};
        var templatesModule = this.data.options.templatesModule ? this.data.options.templatesModule : "bnhpApp.widgets";

        var config = {};

        var copyHtmlTask = [];
        var concatTasks = [];
        var ngtemplatesTasks = [];
        var lessTasks = [];
        var cssminTasks = [];
        var uglifyTasks = [];

        this.files.forEach(function(f) {
            config = {
                clean : {
                    allWidgets : {
                        src : f.dest
                    },
                    widgetsTempFiles : [
                        f.dest + '*/templates.js',
                        f.dest + '*/main.js',
                        f.dest + '*/main.css'
                    ]
                }
            };

            f.src.forEach(  function(path){
                var name = getWidgetName(path);

                if (! ('bnhp_widget_create_html' in config)) config.bnhp_widget_create_html = {};
                if (! ('concat' in config)) config.concat = {};
                if (! ('ngtemplates' in config)) config.ngtemplates = {};
                if (! ('cssmin' in config)) config.cssmin = {};
                if (! ('less' in config)) config.less = {};
                if (! ('uglify' in config)) config.uglify = {};

                config.bnhp_widget_create_html[name] = {
                    options : {
                      name : name
                    },
                    src : path + 'index.html',
                    dest : f.dest + name + '/index.html'
                };

                config.ngtemplates[name] = {
                    src : path + '**/!(index).html',
                    dest : f.dest + name + '/templates.js',
                    options : {
                        url : templatesUrl,
                        module : templatesModule,
                        htmlmin: {
                            collapseWhitespace:             true,
                            removeComments:                 true // Only if you don't use comment directives!
                        }
                    }
                };

                config.concat[name] = {
                    src : [f.dest + name + '/templates.js', path + '**/*.js'],
                    dest : f.dest + name + '/main.js'
                };

                var uglifyFiles = {};
                uglifyFiles[f.dest + name + '/main.min.js'] = f.dest + name + '/**.js';
                config.uglify[name] = {
                    files: uglifyFiles
                };

                var lessFiles = {};
                lessFiles[f.dest + name + '/main.css'] = path + '**/*.less';
                config.less[name] = {
                    files: lessFiles
                };

                var cssminFiles = {};
                cssminFiles[f.dest + name + '/main.min.css'] = f.dest + name + '/main.css';
                config.cssmin[name] = {
                    files: cssminFiles
                };

                copyHtmlTask.push('bnhp_widget_create_html:' + name);
                concatTasks.push('concat:' + name);
                ngtemplatesTasks.push('ngtemplates:' + name);
                lessTasks.push('less:' + name);
                cssminTasks.push('cssmin:' + name);
                uglifyTasks.push('uglify:' + name);

                console.log('widget name', name);
            });


            //load tasks
            grunt.loadNpmTasks('grunt-contrib-concat');
            grunt.loadNpmTasks('grunt-contrib-less');
            grunt.loadNpmTasks('grunt-contrib-cssmin');
            grunt.loadNpmTasks('grunt-contrib-uglify');
            grunt.loadNpmTasks('grunt-angular-templates');
            grunt.loadNpmTasks('grunt-contrib-clean');

            //Register tasks
            grunt.config('clean', config.clean);

            grunt.config('bnhp_widget_create_html', config.bnhp_widget_create_html);
            grunt.config('ngtemplates', config.ngtemplates);
            grunt.config('concat', config.concat);
            grunt.config('less', config.less);
            grunt.config('cssmin', config.cssmin);
            grunt.config('uglify', config.uglify);


            //run tasks
            grunt.task.run([].concat("clean:allWidgets", copyHtmlTask, ngtemplatesTasks, concatTasks, lessTasks, cssminTasks, uglifyTasks, "clean:widgetsTempFiles"));
//            grunt.task.run(ngtemplatesTasks);
        });
    });

};
