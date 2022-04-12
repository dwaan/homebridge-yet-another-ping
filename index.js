'use strict';

let ping = require('nodejs-ping-wrapper');
let Service, Characteristic;

const PLUGIN_NAME = 'homebridge-yet-another-ping';

module.exports = (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerPlatform(PLUGIN_NAME, 'HomebridgeYAP', YAPPluginPlatform, true);
};

class YAPPlugin {
    constructor(log, config, api) {
        if (!config) return;

        this.log = log;
        this.config = config;
        this.api = api;

        // Configuration
        // Name
        this.name = this.config.name || 'Ping Accessory';
        // IP
        this.ip = this.config.ip;
        if (!this.ip) {
            this.log.error(`\n\nPlease provide IP for this accessory: ${this.name}\n`);
            return;
        }
        // Alive
        this.alive = this.config.alive || 20;
        if (this.alive < 1) this.alive = 1;
        // Every
        this.every = this.config.every || 4;
        if (this.every < 1) this.every = 1;
        // Type
        this.type = this.config.type || "Occupancy";

        // The accessory
        this.pingAccessory = new ping(this.ip, this.alive, this.every);

        /**
         * Create the Homekit Accessories
         */

        // generate a UUID
        const uuid = this.api.hap.uuid.generate('homebridge:yap-plugin' + this.ip);

        // create the external accessory
        this.accessory = new this.api.platformAccessory(this.name, uuid);

        // add the accessory service
        if (this.type == "Lock") {
            this.pingStatus = Characteristic.LockCurrentState.UNKNOWN;
            this.accessoryService = this.accessory.addService(Service.LockMechanism);

            this.accessoryService.getCharacteristic(Characteristic.LockCurrentState)
                .onGet(this.get.bind(this));

            this.accessoryService.getCharacteristic(Characteristic.LockTargetState)
                .onGet(this.target.bind(this))
                .onSet(this.set.bind(this));
        } else if (this.type == "Smoke") {
            this.pingStatus = Characteristic.SmokeDetected.SMOKE_NOT_DETECTED;
            this.accessoryService = this.accessory.addService(Service.SmokeSensor);

            this.accessoryService.getCharacteristic(Characteristic.SmokeDetected)
                .onGet(this.get.bind(this));
        } else if (this.type == "Contact") {
            this.pingStatus = Characteristic.ContactSensorState.CONTACT_DETECTED;
            this.accessoryService = this.accessory.addService(Service.ContactSensor);

            this.accessoryService.getCharacteristic(Characteristic.ContactSensorState)
                .onGet(this.get.bind(this));
        } else {
            this.pingStatus = Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
            this.accessoryService = this.accessory.addService(Service.OccupancySensor);

            this.accessoryService.getCharacteristic(Characteristic.OccupancyDetected)
                .onGet(this.get.bind(this));
        }

        // get accessory information
        this.accessoryInfo = this.accessory.getService(Service.AccessoryInformation);

        this.accessoryInfo
            .setCharacteristic(Characteristic.Model, "YAP")
            .setCharacteristic(Characteristic.Manufacturer, "Homebridge YAP")
            .setCharacteristic(Characteristic.SerialNumber, this.ip);
        this.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);

        this.pingAccessory.on('awake', () => {
            this.log.debug(`${this.name} -> awake`);
            this.update(false);
        });

        this.pingAccessory.on('sleep', () => {
            this.log.debug(`${this.name} -> sleep`);
            this.update(true);
        });

        this.pingAccessory.on(`connected`, () => {
            this.log.debug(`${this.name} -> ready`);
            this.pingAccessory.status((status) => {
                this.update(status);
            });
        });

        this.pingAccessory
            .connect()
            .catch(error => this.log.error(error));
    }

    convert(value) {
        if (this.type == "Lock")
            return value === undefined ? Characteristic.LockCurrentState.UNKNOWN : value ? Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.SECURED;
        else if (this.type == "Smoke")
            return value ? Characteristic.SmokeDetected.SMOKE_DETECTED : Characteristic.SmokeDetected.SMOKE_NOT_DETECTED;
        else if (this.type == "Contact")
            return value ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED : Characteristic.ContactSensorState.CONTACT_DETECTED;
        else
            return value ? Characteristic.OccupancyDetected.OCCUPANCY_DETECTED : Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
    }

    update(value) {
        this.pingStatus = this.convert(value);

        if (this.type == "Lock")
            this.accessoryService.updateCharacteristic(Characteristic.LockCurrentState, this.pingStatus);
        else if (this.type == "Smoke")
            this.accessoryService.updateCharacteristic(Characteristic.SmokeDetected, this.pingStatus);
        else if (this.type == "Contact")
            this.accessoryService.updateCharacteristic(Characteristic.ContactSensorState, this.pingStatus);
        else
            this.accessoryService.updateCharacteristic(Characteristic.OccupancyDetected, this.pingStatus);
    }

    get() {
        return this.pingStatus;
    }

    set(value) {
        if (this.type == "Lock")
            this.accessoryService.updateCharacteristic(Characteristic.LockTargetState, value);

        this.log.debug(`${this.name}: set to -> ${value}, this do nothing.`);
    }

    target() {
        return this.pingStatus == Characteristic.LockCurrentState.UNKNOWN ? Characteristic.LockCurrentState.SECURED : this.pingStatus;
    }
}

class YAPPluginPlatform {
    constructor(log, config, api) {
        if (!config) return;

        this.log = log;
        this.api = api;
        this.config = config;

        if (this.api) this.api.on('didFinishLaunching', this.initAccessory.bind(this));
    }

    initAccessory() {
        // read from config.accessories
        if (this.config.accessories && Array.isArray(this.config.accessories)) {
            for (let accessory of this.config.accessories) {
                if (accessory) new YAPPlugin(this.log, accessory, this.api);
            }
        } else if (this.config.accessories) {
            this.log.info('Cannot initialize. Type: %s', typeof this.config.accessories);
        }

        if (!this.config.accessories) {
            this.log.info('-------------------------------------------------');
            this.log.info('Please add one or more accessories in your config');
            this.log.info('-------------------------------------------------');
        }
    }
}