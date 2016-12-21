'use strict';

const debug = require('debug')('oddworks:provider:jwplayer:fetch-jwplayer-playlist');

module.exports = function (bus, client, transform) {
	return function fetchChannelCollection(args) {
		const spec = args.spec;
		const channel = args.channel;
		const secrets = (args.channel.secrets || {}).jwPlatform || {};
		const playlistId = args.playlistId;
		let collection;

		const playlistArgs = {
			playlistId,
			apiKey: secrets.apiKey || client.apiKey,
			secretKey: secrets.secretKey || client.secretKey
		};

		debug(`Getting Playlist - playlistId: ${playlistId}`);
		// First, get the channel object from jwplayer.
		return client.getPlaylist(playlistArgs)
			.then(playlist => {
				if (playlist) {
					// If the playlist object exists, cast it to an Oddworks collection.
					collection = transform(spec, playlist);

					debug(`Getting Videos By Playlist - playlistId: ${playlistId}`);
					return Promise.all([
						client.getVideosByPlaylist(playlistArgs)
					]);
				}

				const error = new Error(`JW Player channel not found for id "${playlistId}"`);
				error.code = 'JW_CHANNEL_PLAYLIST_NOT_FOUND';

				// Report the JW_CHANNEL_PLAYLIST_NOT_FOUND error.
				bus.broadcast({level: 'error'}, {
					spec,
					error,
					code: error.code,
					message: 'playlist not found'
				});

				// Return a rejection to short circuit the rest of the operation.
				return Promise.reject(error);
			})
			.then(results => {
				const videos = (results[0] || {}).videos || [];

				if (videos && videos.length) {
					return Promise.all(videos.map(video => {
						return bus.sendCommand(
							{role: 'catalog', cmd: 'setItemSpec'},
							{channel: channel.id, type: 'videoSpec', source: 'jwplayer-video-provider', video}
						);
					}));
				}

				return [];
			})
			.then(specs => {
				collection.relationships = collection.relationships || {};

				// Assign the relationships.
				collection.relationships.entities = {
					data: specs.map(spec => {
						return {
							type: spec.type.replace(/Spec$/, ''),
							id: `res-jwplayer-video-${spec.resource}`
						};
					})
				};

				return collection;
			});
	};
};
