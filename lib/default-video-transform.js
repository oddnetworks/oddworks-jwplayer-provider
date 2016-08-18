'use strict';

module.exports = function defaultAssetTransform(spec, video, conversions) {
	return Object.assign({}, spec, video, {
		title: video.title,
		description: video.description,
		images: [
			{url: `http://content.jwplatform.com/thumbs/${video.key}-1920.jpg`, width: 1920, height: 1080, mimeType: 'images/jpeg'},
			{url: `http://content.jwplatform.com/thumbs/${video.key}-1280.jpg`, width: 1280, height: 720, mimeType: 'images/jpeg'},
			{url: `http://content.jwplatform.com/thumbs/${video.key}-720.jpg`, width: 720, height: 405, mimeType: 'images/jpeg'},
			{url: `http://content.jwplatform.com/thumbs/${video.key}-480.jpg`, width: 480, height: 270, mimeType: 'images/jpeg'},
			{url: `http://content.jwplatform.com/thumbs/${video.key}-320.jpg`, width: 320, height: 180, mimeType: 'images/jpeg'},
			{url: `http://content.jwplatform.com/thumbs/${video.key}-120.jpg`, width: 120, height: 68, mimeType: 'images/jpeg'}
		],
		sources: conversions.map(conversion => {
			return {
				url: `${conversion.link.protocol}://${conversion.link.address}${conversion.link.path}`,
				width: conversion.width,
				height: conversion.height,
				container: conversion.template.format.key
			};
		}),
		player: {
			type: 'jwplayer',
			id: video.key
		}
	});
};
