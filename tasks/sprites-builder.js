// Generated by CoffeeScript 1.10.0
(function() {
  var Mustache, _, async, build, defaultTemplates, fs, md5, path, slash, spritesFolderHash, writeTemplate;

  _ = require('underscore');

  fs = require('fs');

  md5 = require('md5');

  path = require('path');

  async = require('async');

  slash = require('slash');

  build = require('sprite-builder');

  Mustache = require('mustache');

  defaultTemplates = {
    'json': path.resolve(__dirname, '..', 'templates', 'json.template'),
    'less': path.resolve(__dirname, '..', 'templates', 'less.template'),
    'anim': path.resolve(__dirname, '..', 'templates', 'anim.template')
  };

  spritesFolderHash = function(src) {
    var buffer, file, files, k, len, p, s;
    buffer = "";
    files = fs.readdirSync(src);
    for (k = 0, len = files.length; k < len; k++) {
      file = files[k];
      p = path.join(src, file);
      s = fs.statSync(p);
      buffer += "" + (slash(p)) + (s.mtime.valueOf()) + s.size;
    }
    return md5(buffer);
  };

  writeTemplate = function(input, output, data, grunt) {
    var ref, result, template, templatePath;
    templatePath = (ref = defaultTemplates[input]) != null ? ref : input;
    template = fs.readFileSync(templatePath, 'utf8');
    result = Mustache.render(template, data);
    fs.writeFileSync(output, result, 'utf8');
    return grunt.log.writeln("created: " + output);
  };

  module.exports = function(grunt) {
    return grunt.registerMultiTask('spriteBuilder', 'Make sprite atlases', function() {
      var cacheData, dest, done, e, error1, error2, file, fn, folder, folders, k, l, len, len1, oldSprites, options, process, ref, results;
      done = this.async();
      options = this.options({
        method: 'growing',
        padding: 0,
        trim: false,
        templates: {},
        cache: true,
        cacheFile: ".sprite-builder-cache.json",
        filter: /\.png$/i
      });
      dest = this.data.dest;
      folders = [];
      ref = this.files;
      for (k = 0, len = ref.length; k < len; k++) {
        file = ref[k];
        folders = folders.concat(file.src);
      }
      try {
        oldSprites = fs.readdirSync(dest).map(function(file) {
          return path.join(dest, file);
        });
      } catch (error1) {
        e = error1;
        console.log(e);
        oldSprites = [];
      }
      if (options.cache) {
        try {
          cacheData = grunt.file.readJSON(options.cacheFile);
        } catch (error2) {
          e = error2;
          cacheData = {};
        }
      } else {
        cacheData = {};
      }
      process = [];
      results = {};
      fn = function(folder) {
        var basename, name;
        basename = path.basename(folder);
        name = path.join(dest, basename + "-" + (spritesFolderHash(folder)) + ".png");
        if (_(oldSprites).include(name) && cacheData[name]) {
          return results[name] = cacheData[name];
        } else {
          return process.push(function(cb) {
            return build.processOne(folder, {
              dest: name,
              padding: options.padding,
              method: options.method,
              trim: options.trim,
              templates: {},
              filter: options.filter
            }, function(error, result) {
              if (error) {
                return cb(error);
              }
              results[name] = result;
              results[name].basename = basename;
              grunt.log.writeln("created: " + name);
              return cb(null);
            });
          });
        }
      };
      for (l = 0, len1 = folders.length; l < len1; l++) {
        folder = folders[l];
        fn(folder);
      }
      return async.series(process, function(error) {
        var data, error3, fkey, fkeys, i, len2, len3, m, n, name, old, out, ref1;
        if (error) {
          return done(false, error);
        }
        for (m = 0, len2 = oldSprites.length; m < len2; m++) {
          old = oldSprites[m];
          if (!(!results[old])) {
            continue;
          }
          fs.unlinkSync(old);
          grunt.log.writeln("deleted: " + old);
        }
        if (process.length <= 0) {
          return done(true);
        }
        data = {
          files: []
        };
        fkeys = _.chain(results).keys().sortBy().value();
        for (i = n = 0, len3 = fkeys.length; n < len3; i = ++n) {
          fkey = fkeys[i];
          file = results[fkey];
          file.dest = slash(file.dest);
          file.isLastFile = i === (fkeys.length - 1);
          file.name = fkey;
          file.spritesLength = file.sprites.length;
          data.files.push(file);
          file.sprites = _(file.sprites).sortBy('name');
          _(file.sprites).each(function(s, j) {
            s.dest = file.dest;
            return s.isLastSprite = j === file.sprites.length - 1;
          });
        }
        ref1 = options.templates;
        for (name in ref1) {
          out = ref1[name];
          try {
            writeTemplate(name, out, data, grunt);
          } catch (error3) {
            e = error3;
            grunt.log.writeln(e);
          }
        }
        if (options.cache) {
          fs.writeFileSync(options.cacheFile, JSON.stringify(results), 'utf8');
        }
        return done(true);
      });
    });
  };

}).call(this);
