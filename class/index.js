'use strict';
var yeoman = require('yeoman-generator');
var updateNotifier = require('update-notifier');
var Base = yeoman.generators.Base;
var shell = require('shelljs');
var chalk = require('chalk');
var fs = require('fs');
var path = require('path');
var Q = require('q');

/**
 * The `Class` generator has several helpers method to help with creating a new generator.
 *
 * It can be used in place of the `Base` generator
 *
 * @augments Base
 * @alias Easy
 */
module.exports = Base.extend({

    /**
     *  Ctor
     *
     * @constructor
     */
    constructor: function() {
        Base.apply(this, arguments);
        this.utils = {};
        this.travisOptions = {
            version: '1.7.2'
        };
        this.utils.shell = shell;
        this.utils.updateNotifier = updateNotifier;
    },

    /**
     * Create the standard basic options
     *
     */
    createOptions: function() {
        this.option('check-travis', {
            desc: 'Check if travis cli is installed',
            type: 'Boolean',
            defaults: true
        });

        this.option('check-git', {
            desc: 'Check if git cli is installed',
            type: 'Boolean',
            defaults: true
        });

        this.option('skip-welcome-message', {
            desc: 'Skip the welcome message',
            type: 'Boolean',
            defaults: false
        });
    },

    /**
     * Check if a command line utility is installed
     *
     * @private
     *
     * @param {String} cmd - The name of the command line utility (example : git)
     * @param {Boolean} exit - true if process should exit, false otherwise, defaults to false
     *
     * @returns {Q.promise} - A promise returning undefined if check was skipped, false if not installed or true if installed
     */
    checkCmd: function(cmd, exit) {
        exit = exit !== false;

        var deferred = Q.defer();

        if(this.options['check-' + cmd] === false) {
            deferred.resolve(undefined);
        }

        if(!this.utils.shell.which(cmd)) {
            this.log(chalk.red.bold('(ERROR)') + ' It looks like you do not have ' + cmd + ' installed...');
            if(exit === true) {
                deferred.reject(new Error(cmd + ' is missing'));
                this.utils.shell.exit(1);
            } else {
                deferred.resolve(false);
            }

        } else {
            this.log(chalk.gray(cmd + ' is installed, continuing...\n'));
            deferred.resolve(true);
        }

        return deferred.promise;
    },

    /**
     * Check if git is installed
     *
     * @returns {Q.promise} - A promise returning undefined if check was skipped, false if not installed or true if installed
     */
    checkGit: function() {
        return this.checkCmd('git', true);

    },

    /**
     * Check if travis is installed
     *
     * @returns {Q.promise} - A promise returning undefined if check was skipped, false if not installed or true if installed
     */
    checkTravis: function() {
        return this.checkCmd('travis', false)
            .then(function(value) {
                if(value === false) {
                    this.utils.shell.exec('gem install travis -v' + this.travisOptions.version + ' --no-rdoc --no-ri');
                    return true;
                }
                return value;
            }.bind(this));
    },

    notifyUpdate: function(pkg) {
        var notifier = this.utils.updateNotifier({
            packageName: pkg.name,
            packageVersion: pkg.version,
            updateCheckInterval: 1
        });
        if(notifier.update) {
            if(notifier.update.latest !== pkg.version) {
                notifier.notify();
                this.utils.shell.exit(1);
            }
        }
    },

    hasListOption: function(answers, list, option) {
        if(!answers || !answers[list]) {
            return false;
        }
        return answers[list].indexOf(option) !== -1;
    },

    choicesToProperties: function(answers, choices, name) {
        choices.forEach(function(choice) {
            this[choice.value] = this.hasListOption(answers, name, choice.value);
        }.bind(this));
    },

    /**
     * Get the list of directories given a path (Promise)
     * @param {String} dirPath - The path to start looking for sub diretories
     *
     * @returns {String[]} - An array of sub directories names
     */
    getDirectories: function(dirPath) {
        var deferred = Q.defer();
        fs.readdir(dirPath, function(err, files) {
            if(err) {
                deferred.reject(err);
                return deferred.promise;
            }

            var result = files.filter(function(file) {
                return fs.statSync(path.join(dirPath, file)).isDirectory();
            });
            deferred.resolve(result);

        });

        return deferred.promise;
    },

    /**
     * Return the list of angularjs client modules (Promise)
     *
     * @returns {String[]} - An array of client modules
     */
    getClientModules: function() {
        return this.getDirectories(path.join(this.destinationRoot(), 'client', 'scripts'));
    }

});