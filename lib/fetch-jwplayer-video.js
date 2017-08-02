'use strict';

const Promise = require('bluebird');
const debug = require('debug')('oddworks:provider:jwplayer:fetch-jwplayer-video');

module.exports = function (bus, client, transform) {
	return function fetchVideo(args) {
		const secrets = (args.channel.secrets || {}).jwPlatform || {};
		const spec = args.spec;
		const videoId = args.spec.video.mediaid;

		const videoArgs = {
			videoId,
			apiKey: secrets.apiKey || client.apiKey,
			secretKey: secrets.secretKey || client.secretKey
		};

		debug(`Getting Video - videoId: ${videoId}`);
		return client.getMedia(videoArgs)
			.then(res => {
				const playlist = (res || {}).playlist || [];
				const video = playlist[0];
				if (video) {
					const sources = video.sources || [];
					if (sources.length === 0) {
						debug(`No sources found for JWPlayer Video with mediaid of: ${video.mediaid}`);
					}

					return transform({
						spec,
						video,
						sources
					});
				}

				const error = new Error(`Video not found for id "${videoId}"`);
				error.code = 'VIDEO_NOT_FOUND';

				bus.broadcast({level: 'error'}, {
					spec,
					error,
					code: error.code,
					message: 'video not found'
				});

				return Promise.reject(error);
			});
	};
};
