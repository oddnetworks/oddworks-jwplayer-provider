'use strict';

const debug = require('debug')('oddworks:provider:jwplayer:fetch-jwplayer-playlist');
const provider = require('../');

module.exports = (bus, client, transform) => {
	return args => {
		const spec = args.spec;
		const channel = args.channel;
		const secrets = (args.channel.secrets || {}).jwplayer || {};
		const playlistId = args.spec.playlist.key || args.spec.playlist.id;
		let collection;
		let videos;

		const playlistArgs = {
			playlistId,
			apiKey: secrets.apiKey || client.apiKey,
			secretKey: secrets.secretKey || client.secretKey
		};

		debug(`Getting Playlist - playlistId: ${playlistId}`);
		// First, get the channel object from jwplayer.
		return client.getVideosByPlaylist(playlistArgs)
			.then(res => {
				if (res) {
					videos = res.playlist || [];
					return client.getPlaylist(playlistArgs);
				}
			})
			.then(playlist => {
				if (playlist) {
					// If the playlist object exists, cast it to an Oddworks collection.
					const playlistFields = playlist.channel;
					playlistFields.videos = videos;

					// storing all the videos returned from the inital call to the spec will allow us to pull videos from the spec to prevent more api calls
					collection = transform(spec, playlistFields);

					debug(`Getting Videos By Playlist - playlistId: ${playlistId}`);
					return null;
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
			.then(() => {
				const role = 'catalog';
				const cmd = 'setItemSpec';
				const type = 'videoSpec';
				const source = 'jwplayer-video-provider';

				videos = videos || [];

				return Promise.all(videos.map(video => {
					if (video.id || video.mediaid) {
						video.id = video.id || video.mediaid;

						const idSuffix = provider.utils.composeVideoId(channel.id, video.id);

						const videoSpec = {
							channel: channel.id,
							type,
							id: `spec-${idSuffix}`,
							source,
							video
						};
						return bus.sendCommand({role, cmd}, videoSpec);
					}

					const error = new Error(`JW Player video id or mediaid not found for object: ${JSON.stringify(video)}`);
					error.code = 'JW_VIDEO_ID_NOT_FOUND';

					// Report the JW_CHANNEL_PLAYLIST_NOT_FOUND error.
					bus.broadcast({level: 'error'}, {
						spec,
						error,
						code: error.code,
						message: 'video.id or video.mediaid not found'
					});

					// Return a rejection to short circuit the rest of the operation.
					return Promise.reject(error);
				}));
			})
			.then(videoSpecs => {
				collection.relationships = collection.relationships || {};
				// Assign the relationships.
				collection.relationships.entities = {
					data: videoSpecs.map(spec => {
						const idSuffix = provider.utils.composeVideoId(channel.id, spec.resource);
						return {
							type: spec.type.replace(/Spec$/, ''),
							id: `res-${idSuffix}`
						};
					})
				};

				return collection;
			});
	};
};
