//TODO : notificationExec, shellExec
Module.register("MMM-GroveGestures", {
  defaults: {
    verbose:false,
    recognitionTimeout: 1000,
    cancelGesture: "WAVE",
    visible: true,
    idleTimer: 1000*60*30, // `0` for disable
    onIdle: {
      moduleExec: {
        module: [],
        exec: (module) => {
          module.hide(1000, null, {lockstring:"GESTURE"})
        }
      }
    },
    onDetected: {
      notificationExec: {
        notification: "GESTURE_DETECTED",
      },
      /*
      moduleExec: {
        module: [],
        exec: (module) => {
          module.show(1000, null, {lockstring:"GESTURE"})
        }
      }
      */
    },
    command: {
      "FORWARD-BACKWARD": {
        notificationExec: {
          notification: "ASSISTANT_ACTIVATE",
          payload: null
        }
      },
      "LEFT-RIGHT": {
        notificationExec: {
          notification: "ASSISTANT_CLEAR",
          payload:null,
        }
      },
      "CLOCKWISE": {
        moduleExec: {
          module: [],
          exec: (module, gestures) => {
            module.hide(1000, null, {lockstring:"GESTURE"})
          }
        }
      },
      "ANTICLOCKWISE": {
        moduleExec: {
          module: [],
          exec: (module, gestures) => {
            module.show(1000, null, {lockstring:"GESTURE"})
          }
        }
      },
      "LEFT": {
        notificationExec: {
          notification: "ARTICLE_PREVIOUS",
          payload: null,
        }
      },
      "RIGHT": {
        notificationExec: {
          notification: "ARTICLE_NEXT",
          payload: null,
        }
      },
      /*
      "CLOCKWISE-CLOCKWISE": {
        shellExec: "~/MagicMirror/modules/MMM-GroveGestures/scripts/screenoff.sh"
      },
      "ANTICLOCKWISE-ANTICLOCKWISE": {
        shellExec: "~/MagicMirror/modules/MMM-GroveGestures/scripts/screenon.sh"
      },
      */
    },

    gestureMapFromTo: {
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
    pythonPath: "/usr/bin/python",

  },

  getStyles: function() {
    return ["MMM-GroveGestures.css"]
  },

  start: function(){
    this.idleTimer = null
  },

  getDom: function() {
    var wrapper = document.createElement("div")
    wrapper.id = "GROVEGESTURE"
    wrapper.className = (this.config.visible) ? "visible" : "non_visible"

    var win = document.createElement("div")
    win.id = "GESTURE_DISP"
    wrapper.appendChild(win)

    return wrapper
  },

  notificationReceived: function(noti, payload, sender) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.prepare()
        break
    }
  },

  socketNotificationReceived: function(noti, payload, sender) {
    var gestures = {
      status: noti,
      last: payload.last,
      sequence: payload.sequence
    }
    if (this.config.onDetected) {
      this.doCommand(this.config.onDetected, gestures)
    }
    switch(noti) {
      case "FINISH":
        if (gestures.sequence in this.config.command) {
          this.doCommand(this.config.command[gestures.sequence], gestures)
        }
        setTimeout(()=>{
          this.cancelCommand()
        }, 1000)
        break
      case "ONGOING":
        this.showCommand(gestures)
        break
      case "CANCEL":
        this.cancelCommand()
        break
    }

    if (this.config.idleTimer > 0) {
      clearTimeout(this.idleTimer)
      this.idleTimer = setTimeout(()=>{
        console.log("idleTimeout")
        this.doCommand(this.config.onIdle, gestures)
      }, this.config.idleTimer)
    }
  },

  showCommand: function(gestures) {
    var sequence = gestures.sequence
    if (this.config.visible) {
      var seq = document.getElementById("GESTURE_DISP")
      seq.innerHTML = sequence
      seq.className = "visible"
    }
  },

  cancelCommand: function() {
    if (this.config.visible) {
      var seq = document.getElementById("GESTURE_DISP")
      seq.className = ""
      seq.innerHTML = ""
    }
  },

  doCommand: function(command, gestures=null) {
    var sequence = gestures.sequence

    if (command.hasOwnProperty("shellExec")) {
      this.sendSocketNotification("SHELLEXEC", command.shellExec)
    }
    if (command.hasOwnProperty("moduleExec")) {
      var tm = command.moduleExec.module
      if (Array.isArray(tm)) {
        // do nothing
      } else if (tm){
        var ttm = tm.toString()
        tm = []
        tm.push(ttm)
      } else {
        tm = []
      }
      var modules = MM.getModules().enumerate((module)=>{
        if (tm.length == 0 || module.name in tm) {
          console.log("EXEC", command.moduleExec.exec)
          command.moduleExec.exec(module, gestures)
        }
      })
    }
    if (command.hasOwnProperty("notificationExec")) {
      var noti = (command.notificationExec.notification) ? command.notificationExec.notification : this.config.defaultNotification
      var payload = (typeof command.notificationExec.payload == "undefined") ? gestures : command.notificationExec.payload
      this.sendNotification(noti, Object.assign({}, payload))
    }
  },

  prepare: function() {
    this.sendSocketNotification("INIT", this.config)
  }
})
