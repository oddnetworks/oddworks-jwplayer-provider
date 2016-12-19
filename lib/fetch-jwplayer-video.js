'use strict';

const Promise = require('bluebird');

module.exports = function (bus, client, transform) {
	return function fetchVideo(args) {
		const channel = args.channel;
		const secrets = channel.secrets || {};
		const spec = args.spec;
		const videoId = args.videoId;

		const videoArgs = Object.assign({videoId});
		videoArgs.apiKey = secrets.apiKey || client.apiKey;
		videoArgs.secretKey = secrets.secretKey || client.secretKey;

		return client.getVideo(videoArgs)
			.then(video => {
				if (video) {
					// to limit api usage, only get conversions if a video exists
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
