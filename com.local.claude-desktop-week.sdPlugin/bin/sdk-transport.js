"use strict";
const { EventEmitter } = require("node:events");
// Map the controller's existing protocol onto public official-SDK APIs.
// The SDK owns registration and the protected Marketplace connection.
function createSdkTransport(sd) {
  return class SdkTransport extends EventEmitter {
    static OPEN = 1;
    readyState = 0;
    constructor() {
      super();
      const forward = (event) => (ev) => {
        if (!ev.action) return;
        this.emit("message", Buffer.from(JSON.stringify({
          event, context: ev.action.id, action: ev.action.manifestId,
          payload: ev.payload || {},
        })));
      };
      sd.actions.onWillAppear(forward("willAppear"));
      sd.actions.onWillDisappear(forward("willDisappear"));
      sd.actions.onKeyDown(forward("keyDown"));
      sd.settings.onDidReceiveSettings(forward("didReceiveSettings"));
      sd.ui.onDidAppear(forward("propertyInspectorDidAppear"));
      sd.ui.onSendToPlugin(forward("sendToPlugin"));
      sd.connect().then(() => {
        this.readyState = 1;
        this.emit("open");
      }).catch(() => this.emit("error", new Error("Stream Deck connection failed")));
    }
    send(bytes) {
      const { event, context, payload } = JSON.parse(bytes);
      const action = sd.actions.getActionById(context);
      let result;
      if (event === "setImage" && action?.isKey())
        result = action.setImage(payload.image, { target: payload.target });
      else if (event === "setTitle" && action?.isKey())
        result = action.setTitle(payload.title, { target: payload.target });
      else if (event === "setSettings" && action)
        result = action.setSettings(payload);
      else if (event === "sendToPropertyInspector" && sd.ui.action?.id === context)
        result = sd.ui.sendToPropertyInspector(payload);
      // Registration is performed by sd.connect(), never sent a second time.
      if (result?.catch) result.catch(() => sd.logger.error("Stream Deck action update failed"));
    }
  };
}
module.exports = { createSdkTransport };
