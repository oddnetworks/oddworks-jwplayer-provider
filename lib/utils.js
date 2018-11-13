'use strict';

exports.formatReleaseDate = releaseTime => {
	let releaseDate = new Date();

	if (releaseTime.length > 0 || releaseTime > 0) {
		releaseDate = new Date(releaseTime * 1000);
	}

	return releaseDate.toISOString();
};

exports.mimetypeFromSource = source => {
	const mimetypes = {
		audio: {
			aac: 'audio/aac',
			mp4: 'audio/mp4',
			mpeg: 'audio/mpeg',
			ogg: 'audio/ogg',
			wav: 'audio/wav',
			webm: 'audio/webm'
		},
		application: {
			mpd: 'application/dash+xml',
			m3u8: 'application/x-mpegURL'
		},
		video: {
			mp4: 'video/mp4',
			ogg: 'video/ogg',
			webm: 'video/webm',
			mkv: 'video/mkv'
		},
		text: {
			vtt: 'text/vtt'
		}
	};

	// jw Source
	// {
	// 	"width": 1280,
	// 	"type": "application/vnd.apple.mpegurl",
	// 	"file": "https://cdn.jwplayer.com/manifests/O2AWXESU.m3u8?exp=1501260480&sig=611883f362a0e0b0021be2e7dc8abe04",
	// 	"height": 720
	// }
	const file = source.file || '';
	const type = source.type || '';

	let sourceMimetype = '';

	if (type.indexOf('application') > -1) {
		// checking for file extensions here because jw uses a nonstandard m3u8 mimetype
		for (const key in mimetypes.application) {
			if (file.indexOf(`.${key}`) > -1) {
				sourceMimetype = mimetypes.application[key];
			}
		}
	}

	if (type.indexOf('video') > -1) {
		for (const key in mimetypes.video) {
			// just use the type for video
			if (type === mimetypes.video[key]) {
				sourceMimetype = mimetypes.video[key];
			}
		}
	}

	if (type.indexOf('audio') > -1) {
		for (const key in mimetypes.audio) {
			// just use the type for audio
			if (type === mimetypes.audio[key]) {
				sourceMimetype = mimetypes.audio[key];
			}
		}
	}

	if (type.indexOf('text') > -1) {
		sourceMimetype = mimetypes.text.vtt;
	}

	return sourceMimetype;
};

exports.containerFromSource = source => {
	let container = '';
	const file = source.file || '';

	if (file.indexOf(`.m3u8`) > -1) {
		container = 'hls';
	} else if (file.indexOf(`.mp3`) > -1) {
		container = 'mp3';
	} else if (file.indexOf(`.mp4`) > -1) {
		container = 'mp4';
	} else if (file.indexOf(`.m4a`) > -1) {
		container = 'mp4';
	}

	return container;
};

exports.composeCollectionId = (channel, collectionId) => {
	return `jwplayer-collection-${channel}-${collectionId}`;
};

exports.composeVideoId = (channel, videoId) => {
	return `jwplayer-video-${channel}-${videoId}`;
};
