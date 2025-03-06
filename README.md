[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm-version](https://badgen.net/npm/v/homebridge-yet-another-ping)](https://www.npmjs.com/package/homebridge-yet-another-ping)
[![npm-total-downloads](https://badgen.net/npm/dt/homebridge-yet-another-ping)](https://www.npmjs.com/package/homebridge-yet-another-ping)

# Yet Another Ping
Yet Another Ping is a HomeBridge plugin to detect accessory power state based on period of ping responses.


## Installation

1. Install Homebridge and Homebridge Config UI X, follow the instruction https://github.com/oznu/homebridge-config-ui-x
2. Install homebridge-yet-another-ping:
    ```sh
    sudo npm install -g homebridge-yet-another-ping
    ```

## Example

```json
"platforms": [{
    "accessories": [
        {
            "name": "Switch",
            "ip": "192.168.1.1",
            "type": "Smoke"
        },
        {
            "name": "LGTV",
            "ip": "192.168.1.2"
        },
        {
            "name": "MBP",
            "ip": "192.168.1.3",
            "type": "Contact"
        },
        {
            "name": "Shield",
            "ip": "192.168.1.4",
            "alive": 1,
            "every": 1,
            "type": "Lock"
        }
    ],
    "platform": "HomebridgeYAP"
}]
```

## Configuration

* **platform** (mandatory): the name of this plugin.
* **name**: the name of the accessory.
* **ip** (mandatory): the IP address of the accessory.
* *type*: Type of the accessory: "Smoke", "Contact", "Lock", and "Occupancy" (default)
* *alive*: Determine how long to observe the ping result in seconds, default: 20
* *every*: Ping will be done every x seconds, default: 4
