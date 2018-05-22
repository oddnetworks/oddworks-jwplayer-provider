'use strict';

const Promise = require('bluebird');
const debug = require('debug')('oddworks:provider:jwplayer:create-channel-cache');

const TTL_IN_SECONDS = 300;

module.exports = bus => {
	const channels = Object.create(null);
	const pattern = {role: 'store', cmd: 'get', type: 'channel'};

	const getChannel = id => {
		debug(`get by id ${id}`);
		if (channels[id]) {
			debug(`cache hit for ${id}`);
			return Promise.resolve(channels[id]);
		}

		debug(`cache miss for ${id}`);
		return bus.query(pattern, {id}).then(channel => {
			debug(`setting ${id} in cache`);
			channels[channel.id] = channel;

			// Remove the channel from memory after the time-to-live.
			setTimeout(() => {
				debug(`removing ${id} from cache`);
				delete channels[channel.id];
			}, TTL_IN_SECONDS * 1000);

			return channel;
		});
	};

	return getChannel;
};
