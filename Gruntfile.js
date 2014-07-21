/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> */',
    // Task configuration.
    transport: {
      options: {
        debug: false
      },
      cmd: {
        options: {
          idleading: 'lib/<%= pkg.name %>/<%= pkg.version %>/',
          alias: {
            'jquery': 'jquery'
          }
        },
        files: [{
          cwd: 'src',
          src: 'egeui.js',
          dest: '.build'
        }]
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>\n'
      },
      mmui: {
        files: {
          'dist/<%= pkg.version %>/egeui.min.js': ['.build/egeui.js']
        }
      }
    },
    cssmin:{
      mmui: {
        options: {
          banner: '<%= banner %>'
        },
        files: {
          'dist/<%= pkg.version %>/egeui.css': ['src/egeui.css']
        }
      }
    },
    copy: {
      debug: {
        src: 'src/egeui.js',
        dest: 'dist/<%= pkg.version %>/egeui.js',
      },
    },
    clean: {
      build: ['.build']
    },
    connect: {
      server: {
        options: {
          keepalive: true,
          hostname: '192.168.0.105',
          port: 8001,
          // base: '../'
        }
      }
    }
  });


  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-cmd-transport');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  // Default task.
  grunt.registerTask('default', ['transport', 'uglify', 'copy', 'clean']);
};
