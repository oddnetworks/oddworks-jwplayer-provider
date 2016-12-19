'use strict';

module.exports = function defaultCollectionTransform(spec, playlist) {
	const now = new Date();
	return {
		id: `res-jwplayer-playlist-${playlist.channel.key}`,
		title: playlist.channel.title,
		type: 'collection',
		description: playlist.channel.description,
		genres: [],
		images: [],
		meta: {
			custom: playlist.channel.custom,
			tags: (playlist.channel.tags || '').split(',') || []
		},
		releaseDate: now.toISOString()
	};
};
