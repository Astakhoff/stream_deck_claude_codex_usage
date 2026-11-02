"use strict";
let Transport = require("ws");
module.exports = {
  getTransport: () => Transport,
  setTransport: (value) => { Transport = value; },
};
