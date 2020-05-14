/* global Module */

/* Magic Mirror
 * Module: MMM-Energy-Saver
 *
 * By Claudio Restante
 * https://github.com/restante
 *
 * MIT Licensed.
 */

Module.register('MMM-Energy-Saver', {

    defaults: {
        timeoutInSeconds: 300,        // this is in seconds (not ms)
        triggerMonitor: true,         // whether the monitor should be turned off
        monitorOn: '00 30 7 * * *',   // on at 07:30 am
        monitorOff: '00 30 23 * * *', // off at 11:30 pm
        animationSpeed: 2 * 1000,
        version: '1.0.0',
        exceptModules: [],

    },

    start: function() {

        Log.info('Starting module: ' + this.name + ', version ' + this.config.version);

        this.sendSocketNotification('MMM_ENERGY_SAVER_CONFIG', this.config);

        this.sleepTimer = null;
        this.sleeping = false;
        this.deepSleep = false; // when the monitor is off
       

    },

    notificationReceived(notification, payload, sender) {

        var self = this;

        if (notification === 'DOM_OBJECTS_CREATED') {

            this.sendSocketNotification('MMM_ENERGY_SAVER_INIT', true);
            clearTimeout(this.sleepTimer);
            self.sendSuspend();
        } else if (notification === 'USER_PRESENCE') {

            if ( !this.deepSleep) {
                    if (self.sleeping) {
                        this.sendResume();
                    }
                    
                    clearTimeout(this.sleepTimer);
                    this.sleepTimer = setTimeout(function() {
                        self.sendSuspend();
                    }, self.config.timeoutInSeconds * 1000);
                
            }

        }

    },

    socketNotificationReceived: function(notification, payload) {

        var self = this;

        if (notification === 'MMM_ENERGY_SAVER_MONITOR_OFF') {

            this.deepSleep = true;
            clearTimeout(this.sleepTimer);
            this.sendSuspend();

        } else if (notification === 'MMM_ENERGY_SAVER_MONITOR_ON') {

            this.deepSleep = false;
            this.sendResume();

            // restart regular timer
            clearTimeout(this.sleepTimer);
            this.sleepTimer = setTimeout(function() {
                self.sendSuspend();
            }, self.config.timeoutInSeconds * 1000);

        }

    },

    sendSuspend: function() {

        var self = this;

        if (!this.sleeping) {

            this.sleeping = true;

            // hide all modules
            MM.getModules().exceptModule(this).enumerate(function(module) {
                if (self.config.exceptModules.indexOf(module.name) === -1) {
                    module.hide(self.config.animationSpeed);
                    console.log(self.name + ' has suspended ' + module.name);
                }
            });

            // send notification
            
            this.sendNotification('MMM_ENERGY_SAVER', 'suspend');

        }

    },

    sendResume: function() {

        var self = this;

        if (this.sleeping) {

            this.sleeping = false;

            // show all modules
            MM.getModules().exceptModule(this).enumerate(function(module) {
                if (self.config.exceptModules.indexOf(module.name) === -1) {
                    module.show(self.config.animationSpeed);
                    console.log(self.name + ' has resumed ' + module.name);
                }
            });

            // send notification
            
            this.sendNotification('MMM_ENERGY_SAVER', 'resume');

        }

    }

});
