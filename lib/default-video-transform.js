'use strict';

const utils = require('./utils');

module.exports = args => {
	const video = args.video || {};
	const spec = args.spec || {};
	let videoSources = (args || {}).sources || [];

	if (!Array.isArray(videoSources)) {
		videoSources = [];
	}

	const duration = Math.round((video.duration || 0) * 1000);
	const tags = video.tags.split(',') || [];
	const releaseDate = utils.formatReleaseDate(video.pubdate || '');

	const widths = [1920, 1280, 720, 480, 320, 120];
	const images = [];
	const sources = [];

	widths.map(width => {
		images.push({
			url: `http://content.jwplatform.com/thumbs/${video.mediaid}-${width}.jpg`,
			width,
			mimeType: 'image/jpeg'
		});
		return width;
	});

	videoSources.map(vSource => {
		sources.push({
			url: vSource.file || '',
			width: vSource.width || '',
			height: vSource.height || '',
			sourceType: 'VOD',
			broadcasting: false,
			container: utils.containerFromSource(vSource),
			mimeType: utils.mimetypeFromSource(vSource)
		});
		return vSource;
	});

	return {
		id: spec.id.replace(/^spec/, 'res'),
		type: 'video',
		title: video.title,
		description: video.description,
		images,
		sources,
		cast: [],
		duration,
		genres: [],
		releaseDate,
		tags,
		meta: {}
	};
};
