'use strict';

const formatReleaseDate = require('./utils').formatReleaseDate;

module.exports = function defaultAssetTransform(args) {
	// const spec = args.spec || {};
	const video = args.video || {};
	let conversions = (args || {}).conversions || [];

	if (!Array.isArray(conversions)) {
		conversions = [];
	}

	const duration = Math.round((video.duration || 0) * 1000);
	const meta = video.custom || {};
	const tags = video.tags.split(',') || [];
	const releaseDate = formatReleaseDate(video.date || '');

	const widths = [1920, 1280, 720, 480, 320, 120];
	const images = [];
	const sources = [];

	widths.map(width => {
		images.push({
			url: `http://content.jwplatform.com/thumbs/${video.key}-${width}.jpg`,
			width,
			mimeType: 'images/jpeg'
		});
		return width;
	});

	conversions.map(conversion => {
		if (conversion.status.toLowerCase() === 'ready') {
			const protocol = (conversion.link || {}).protocol || '';
			const address = (conversion.link || {}).address || '';
			const path = (conversion.link || {}).path || '';

			const template = conversion.template || {};
			const format = template.format || {};

			sources.push({
				url: `${protocol}://${address}${path}`,
				width: conversion.width || '',
				height: conversion.height || '',
				container: format.key || ''
			});
		}
		return conversion;
	});

	return {
		id: `res-jwplayer-video-${video.key}`,
		type: 'video',
		title: video.title,
		description: video.description,
		images,
		sources,
		cast: [],
		duration,
		genres: [],
		meta,
		releaseDate,
		tags
	};
};
