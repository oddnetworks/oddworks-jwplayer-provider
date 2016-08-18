'use strict';

module.exports = function defaultCollectionTransform(spec, playlist) {
	return Object.assign({}, spec, playlist, {
		title: playlist.title
	});
};
