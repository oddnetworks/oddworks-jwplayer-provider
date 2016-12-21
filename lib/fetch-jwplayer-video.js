'use strict';

const Promise = require('bluebird');
const debug = require('debug')('oddworks:provider:jwplayer:fetch-jwplayer-video');

module.exports = function (bus, client, transform) {
	return function fetchVideo(args) {
		const secrets = (args.channel.secrets || {}).jwPlatform || {};
		const spec = args.spec;
		const videoId = args.videoId;

		const videoArgs = {
			videoId,
			apiKey: secrets.apiKey || client.apiKey,
			secretKey: secrets.secretKey || client.secretKey
		};

		debug(`Getting Video - videoId: ${videoId}`);
		return client.getVideo(videoArgs)
			.then(video => {
				if (video) {
					// to limit api usage, only get conversions if a video exists
					debug(`Getting Conversions for Video - videoId: ${videoId}`);
					return client.getConversionsByVideo(videoArgs)
					.then(conversions => {
						// console.log('CONVERSIONS', JSON.stringify(conversions, null, 2));
						const videoConversions = conversions.conversions || [];
						return transform({
							spec,
							video: video.video,
							conversions: videoConversions
						});
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
