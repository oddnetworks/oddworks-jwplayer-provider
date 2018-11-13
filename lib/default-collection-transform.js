'use strict';

module.exports = (spec, playlist) => {
	const releaseDate = new Date();

	return {
		id: spec.id.replace(/^spec/, 'res'),
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
