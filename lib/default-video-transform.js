'use strict';

const utils = require('./utils');

module.exports = args => {
	const video = args.video || {};
	const spec = args.spec || {};
	let videoSources = (args || {}).sources || [];
	const trackSources = (args || {}).tracks || [];

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

	videoSources.forEach(vSource => {
		sources.push({
			url: vSource.file || '',
			width: vSource.width || 0,
			height: vSource.height || 0,
			sourceType: 'VOD',
			broadcasting: false,
			container: utils.containerFromSource(vSource),
			mimeType: utils.mimetypeFromSource(vSource)
		});
		return vSource;
	});

	trackSources.filter(t => {
		return t.kind === 'captions';
	}).forEach(t => {
		sources.push({
			url: t.file || '',
			label: t.label,
			sourceType: 'CAPTION'
		});
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
