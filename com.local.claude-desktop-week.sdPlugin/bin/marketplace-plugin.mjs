import streamDeck from '@elgato/streamdeck';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { setTransport } = require('./transport');
const { createSdkTransport } = require('./sdk-transport');
setTransport(createSdkTransport(streamDeck));
require('./plugin');
