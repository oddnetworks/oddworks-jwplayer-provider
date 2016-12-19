'use strict';

exports.formatReleaseDate = releaseTime => {
	let releaseDate = new Date();

	if (releaseTime.length > 0 || releaseTime > 0) {
		releaseDate = new Date(releaseTime * 1000);
	}

	return releaseDate.toISOString();
};
