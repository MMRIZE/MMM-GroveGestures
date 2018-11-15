# MMM-GroveGestures
MagicMirror Module - detecting 3D gesture with GroveGesture Sensor(PAJ7620u2)

## Screenshot
[![2.1.0 demo](https://img.youtube.com/vi/BcpZvkcrfHU/0.jpg)](https://youtu.be/BcpZvkcrfHU)


## Hardware
![image](/Gesture_sensor_3.png)
- Grove Gesture Sensor (PAJ7620u2)
  - The sensor on Grove - Gesture is PAJ7620U2 that integrates gesture recognition function with general I2C interface into a single chip. It can recognize 9 basic gestures, and these gestures information can be simply accessed via the I2C bus.
  - price: $10~20USD
  - gestures : Up / Down / Left / Right / Forward / Backward / Clockwise / Count Clockwise / Wave
  - detection range : 5 ~ 10cm / non-touch
  - size : 20mm X 20mm


Unfortunately, due to it's short range and theory of electro-magnetic field, this sensor will not be used beneath Spymirror. But under the thin wooden, plastic or normal glass, it will work.
It works as 3D gesture sensor similar with `Skywriter` or `Flick!`, but definitely small, flat, and non-HAT. It could fit for bezel-frame of MagicMirror. Soldering is not needed.

### Comparison
- vs. PIR sensor, ultrasonic sensor, CAM motion detection
  - **PROS**: more gestures
  - **CONS**: short range
- vs. Skywriter, Flick!
  - **PROS**: small
  - **CONS**: touch, tap gestures are not supported
- vs. CAM gesture recognition
  - **PROS**: light, easy, low CPU
  - **CONS**: short range, not so COOL


### REQUIREMENT
- 1 x Grove Gesture Sensor (or PAJ7620u2 compatible)
- 1 x 4pin Female jumper cable

### Pin Connect (I2C 1)
- 5V (GPIO PIN 2)	: VCC
- GND	(GPIO PIN 4) : GND
- SDA	(GPIO PIN 3) : SDA
- SCL	(GPIO PIN 5) : SCL
![](/IMG_0747.jpg)

### Install H/W
- Go to Raspberry config program, set I2C (I2C_1) as enabled. Then shutdown.
- Connect Sensor and RPI with cable. Then power on.
- Check `sudo i2cdetect -y 1` or install it.
```
sudo apt-get update
sudo apt-get install i2c-tools
```
- After installation rebooting might be needed.
- Try again `sudo i2cdetect -y 1`, if you can see `73` on the matrix of result, H/W is installed properly.


## Installation of Module
```
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-GroveGestures
cd MMM-GroveGestures
npm install
cd scripts
chmod +x *.sh
```
You might need to modify `/scripts/*.sh` files for your environment.

After installation of module,
```
cd ~/MagicMirror/modules/MMM-GroveGestures/py
cp grove_gesture_sensor.py.RPI grove_gesture_sensor.py
```

You can test your sensor with this;
```
cd ~/MagicMirror/modules/MMM-GroveGestures/py
python gesture_print.py
```

## Configuration
### Simple Version
```
{
  module: "MMM-GroveGestures",
  position: "top_right",
  config: {}
},
```

### Details and default
```
{
  module: "MMM-GroveGestures",
  position: "top_right",
  config: {
    autoStart: true, //When Mirror starts, recognition will start.
    verbose:false, // If set as `true`, useful messages will be logged.
    recognitionTimeout: 1000, //Gesture sequence will be ended after this time from last recognized gesture.
    cancelGesture: "WAVE", //If set, You can cancel gesture sequence with this gesture.
    visible: true, //Recognized gesture sequence will be displayed on position

    idleTimer: 1000*60*30, // `0` for disable, After this time from last gesture, onIdle will be executed.
    onIdle { // See command section
      moduleExec: {
        module: [],
        exec: (module, gestures) => {
          module.hide(1000, null, {lockstring:"GESTURE"})
        }
      }
    },
    onDetected: {
      notificationExec: {
        notification: "GESTURE_DETECTED",
      },
      /* You can make Mirror to wake up the modules which were hidden by onIdle with any gestures.
      moduleExec: {
        module: [],
        exec: (module) => {
          module.show(1000, null, {lockstring:"GESTURE"})
        }
      }
      */
    },

    gestureMapFromTo: { //When your sensor is installed with rotated direction, you can calibrate with this.
      "Up": "UP",
      "Down": "DOWN",
      "Left": "LEFT",
      "Right": "RIGHT",
      "Forward": "FORWARD",
      "Backward": "BACKWARD",
      "Clockwise": "CLOCKWISE",
      "anti-clockwise": "ANTICLOCKWISE",
      "wave": "WAVE"
    },

    defaultNotification: "GESTURE",
    pythonPath: "/usr/bin/python", // your python path

    command: {
      "FORWARD-BACKWARD": {
        notificationExec: {
          notification: "ASSISTANT_ACTIVATE",
        }
      },
      "LEFT-RIGHT": {
        notificationExec: {
          notification: "ASSISTANT_CLEAR"
        }
      },
      "CLOCKWISE": {
        moduleExec: {
          module: [],
          exec: (module) => {
            module.hide(1000, null, {lockstring:"GESTURE"})
          }
        }
      },
      "ANTICLOCKWISE": {
        moduleExec: {
          module: [],
          exec: (module) => {
            module.show(1000, null, {lockstring:"GESTURE"})
          }
        }
      },
      "LEFT": {
        notificationExec: {
          notification: "ARTICLE_PREVIOUS"
        }
      },
      "RIGHT": {
        notificationExec: {
          notification: "ARTICLE_NEXT"
        }
      },
    },
  }
},
```
### Command
### Prepared Gestures
You can modify, remove or create these gestures commands in `config.js`
- **LEFT** : show previous article of default `newsfeed`
- **RIGHT** : show next article of default `newsfeed`
- **CLOCKWISE** : hide all modules on screen
- **ANTICLOCKWISE** : show all modules(previously hidden by **CLOCKWISE** or **onIdle**)
- **FORWARD-BACKWARD** : activate `MMM-AssistantMk2` instead Hotword
- **LEFT-RIGHT** : stop youtube video(result of `MMM-AssistantMk2`) playing.

#### Structure of `command` in Configuration
```
"GESTURE-SEQUENCE" : {
  shellExec: "...",
  notificationExec: { ... },
  moduleExec: { ... }
}
```
- You can define command with gesture(**LEFT**) or gesture sequence (**LEFT-LEFT-UP**)
- 3 kinds of execution are available (be usable lonely or together)
  - `shellExec` : You can execute this `String` as shell command
  ```
  shellExec: "sudo reboot now"
  ```
  - `notificationExec` : You can send notification with this. If payload is not defined, `gestures` Object will be used by default. If you want null value as payload, just set `payload:null`.
  ```
  notificationExec: {
    notification: "SHOW_ALERT",
    payload: {
      message: "Hello, World",
      timer: 5000
    }
  }
  ```
  - `moduleExec` : You can control Module and it's method. `exec` is function which has `module` and `gestures` objects as arguments.
  ```
  moduleExec: {
    module: ["clock", "newsfeed"], // `[]` will be all modules.
    exec: (module, gestures) => {
      module.hide()
    }
  }
  ```
  - `gestures` Object
  ```
  gestures: {
    status: "FINISH", // "FINISH", "ONGOING", "CANCEL"
    last: "LEFT", // Last detected gesture
    sequence: "UP-DOWN-LEFT", // detected gesture sequence until now
  }
  ```
