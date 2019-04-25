const path = require("path")
const exec = require("child_process").exec
const {PythonShell} = require("python-shell")

var NodeHelper = require('node_helper')

module.exports = NodeHelper.create({

  start: function() {
    this.config = {}
    this.gestureSequence = ""
    this.commandTimer = null
    this.shell = null
  },

  stop: function() {
    this.log("[GESTURE] Finishing...")
    if (this.shell) {
      this.shell.end()
    }
  },

  socketNotificationReceived: function (noti, payload) {
    switch (noti) {
      case "INIT":
        this.job(payload)
        break
      case "SHELLEXEC":
        exec(payload, (e,so,se)=>{
          this.log("[GESTURE] Shell command: " + payload)
          if (e) console.log(e)
        })
        break
    }
  },

  log : function(obj) {
    if (this.config.verbose) {
      console.log(obj)
    }
  },

  job: function(config) {
    this.config = config
    var map = this.config.gestureMapFromTo
    var py = path.resolve(__dirname, "py", "gesture_print.py")
    var option = {
      mode: "text",
      pythonPath:this.config.pythonPath,
      pythonOptions: ['-u'],
    }
    this.shell = new PythonShell(py, option)
    this.shell.on("message", (message)=>{
      this.log("[GESTURE] ORIGIN:" + message)
      var gesture = null
      gesture = (map.hasOwnProperty(message)) ? map[message] : null
      if (gesture) {
        this.gestureProcess(gesture)
      }
    })
    this.shell.on("error", (message)=>{
      this.shell.end()
      if (!message.traceback.search("KeyboardInterrupt")) {
        this.log(message)
      } else {
        this.log("Keyboard Interrupted")
      }
      this.log("[GESTURE] Gesture script is finished.")
    })
    this.shell.on("close", ()=>{
      setTimeout(()=>{
        this.log("[GESTURE] Python script is terminated. It will restart soon.")
        this.job(config)
      }, 500)
    })
  },

  gestureProcess: function(gesture) {
    clearTimeout(this.commandTimer)
    this.commandTimer = null
    if (gesture == this.config.cancelGesture) {
      this.log("[GESTURE] Cancel: " + this.gestureSequence)
      this.sendSocketNotification("CANCEL", {
        last: gesture,
        sequence: this.gestureSequence,
      })
      this.gestureSequence = ""
      clearTimeout(this.commandTimer)
    } else {
      this.gestureSequence += (this.gestureSequence) ? ("-" + gesture) : gesture
      this.log("[GESTURE] Ongoing: " + this.gestureSequence)
      this.sendSocketNotification("ONGOING", {
        last:gesture,
        sequence: this.gestureSequence,
      })
      this.log("[GESTURE] Timer reset")
      this.commandTimer = setTimeout(()=>{
        this.log("[GESTURE] Finish: " + this.gestureSequence)
        this.sendSocketNotification("FINISH", {
          last:gesture,
          sequence: this.gestureSequence,
        })
        this.gestureSequence = ""
      }, this.config.recognitionTimeout)

    }
  },
})
