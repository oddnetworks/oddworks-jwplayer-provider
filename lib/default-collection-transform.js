'use strict';

module.exports = (spec, playlist) => {
	const releaseDate = new Date();

	return {
		id: `res-jwplayer-playlist-${playlist.key}`,
		title: playlist.title,
		type: 'collection',
		description: playlist.description,
		genres: [],
		images: [],
		meta: {
			custom: playlist.custom
		},
		tags: (playlist.tags || '').split(',') || [],
		cast: [],
		releaseDate: releaseDate.toISOString()
	};
};
