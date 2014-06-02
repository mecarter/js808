module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      files: ['index.haml', 'sass/js808.scss'],
      tasks: ['haml', 'compass']
    },
    haml: {
      dist: {
        files: {
          'index.html': 'index.haml'
        }
      }
    },
    compass: {
      dist: {
        options: {
          sassDir: 'sass',
          cssDir: 'css'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-haml');
  grunt.loadNpmTasks('grunt-contrib-compass');

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', ['haml', 'compass']);
  
};