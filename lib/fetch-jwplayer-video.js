'use strict';

module.exports = function (bus, client, transform) {
	return function fetchAsset(args) {
		const channel = args.channel;
		const secrets = channel.secrets || {};
		const spec = args.spec;
		const videoId = args.videoId;

		const creds = Object.create(null);
		if (secrets.jwplayerApiKey && secrets.jwplayerSecretKey) {
			creds.apiKey = secrets.jwplayerApiKey;
			creds.secretKey = secrets.jwplayerSecretKey;
		}

		const params = Object.assign({videoId}, creds);
		return Promise.join(
			client.getVideo(params),
			client.getConversionsByVideo(params),
			(video, conversions) => {
				if (video) {
					return transform(spec, video.video, conversions.conversions);
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
			}
		);
	};
};
