/*
 * grunt-bnhp-widget
 * https://github.com/Ido/grunt-bnhp-widget
 *
 * Copyright (c) 2014 Ido Lempert
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    bnhp_widget: {
        prod : {
            options : {
                templatesUrl : function(url) {
                    return url.replace('DevGuide/src/main/webapp/static/com.poalim.docs', '/movilut_2014');
                },
                templatesModule : "bnhpApp.application.widgets"
            },
            src : 'DevGuide/src/main/webapp/static/com.poalim.docs/widgets/*/',
            dest : 'DevGuide/src/main/webapp/static/com.poalim.docs/widgets.min/'
        }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['bnhp_widget']);
};
