/* global jasmine, describe, beforeAll, it, expect, spyOn */
/* eslint prefer-arrow-callback: 0 */
/* eslint-disable max-nested-callbacks */
'use strict';

const Promise = require('bluebird');
const provider = require('../');

describe('playlistHandler', function () {
	function noop() {}

	describe('when jwplayer playlist not found', function () {
		let result = null;
		let error = null;
		let event = null;
		const spec = {
			channel: 'abc',
			type: 'collectionSpec',
			id: 'spec-123',
			playlist: {id: 'foo'}
		};

		function getChannel() {
			return Promise.resolve({id: 'abc'});
		}

		beforeAll(function (done) {
			const bus = this.createBus();

			bus.observe({level: 'error'}, function (payload) {
				event = payload;
			});

			const client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
			spyOn(client, 'getPlaylist').and.returnValue(Promise.resolve(null));

			const playlistHandler = provider.createPlaylistHandler(bus, getChannel, client, noop);

			return playlistHandler({spec})
				.then(res => {
					result = res;
				})
				.catch(err => {
					error = err;
					done();
				});
		});

		it('does not have a result', function () {
			expect(result).toBe(null);
		});

		it('has an error', function () {
			expect(error.code).toBe('JW_CHANNEL_PLAYLIST_NOT_FOUND');
		});

		it('has an error event', function () {
			expect(event.code).toBe('JW_CHANNEL_PLAYLIST_NOT_FOUND');
			expect(event.message).toBe('playlist not found');
			expect(event.error.code).toBe('JW_CHANNEL_PLAYLIST_NOT_FOUND');
			expect(event.spec.playlist.id).toBe('foo');
		});
	});

	describe('with videos', function () {
		let client;
		let setItemSpec;
		let transform;
		let result;
		let error = null;
		const playlist = {id: 'foo', name: 'PLAYLIST'};
		const spec = {
			channel: 'abc',
			type: 'collectionSpec',
			id: 'spec-123',
			playlist
		};
		const videos = [{title: 'VIDEO_1'}, {title: 'VIDEO_2'}];
		const collection = {title: 'COLLECTION'};

		function getChannel() {
			return Promise.resolve({id: 'abc'});
		}

		beforeAll(function (done) {
			const bus = this.createBus();

			// Mock the Oddworks setItemSpec command for the related videos.
			setItemSpec = jasmine
				.createSpy('setItemSpec')
				.and.returnValues(
					Promise.resolve({type: 'videoSpec', resource: 'foo-123'}),
					Promise.resolve({type: 'videoSpec', resource: 'bar-123'})
				);

			bus.commandHandler({role: 'catalog', cmd: 'setItemSpec'}, setItemSpec);

			// Mock the jwplayer client methods.
			client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
			spyOn(client, 'getPlaylist').and.returnValue(Promise.resolve(playlist));
			spyOn(client, 'getVideosByPlaylist').and.returnValue(Promise.resolve(videos));

			transform = jasmine.createSpy('transform').and.returnValue(collection);

			const playlistHandler = provider.createPlaylistHandler(bus, getChannel, client, transform);

			return playlistHandler({spec})
				.then(res => {
					result = res;
				})
				.catch(err => {
					error = err;
				})
				.then(done);
		});

		it('has a result', function () {
			expect(result.title).toBe('COLLECTION');
		});

		it('does not have an error', function () {
			expect(error).toBe(null);
		});

		it('sends setItemSpec commands', function () {
			expect(setItemSpec).toHaveBeenCalledTimes(2);
			expect(setItemSpec).toHaveBeenCalledWith({
				channel: 'abc',
				type: 'videoSpec',
				source: 'jwplayer-video-provider',
				video: videos[0]
			});
			expect(setItemSpec).toHaveBeenCalledWith({
				channel: 'abc',
				type: 'videoSpec',
				source: 'jwplayer-video-provider',
				video: videos[1]
			});
		});

		it('calls client.getPlaylist()', function () {
			expect(client.getPlaylist).toHaveBeenCalledTimes(1);
			expect(client.getPlaylist).toHaveBeenCalledWith({
				playlistId: 'foo',
				apiKey: 'foo',
				secretKey: 'bar'
			});
		});

		it('calls client.getVideosByPlaylist()', function () {
			expect(client.getVideosByPlaylist).toHaveBeenCalledTimes(1);
			expect(client.getVideosByPlaylist).toHaveBeenCalledWith({
				playlistId: 'foo',
				apiKey: 'foo',
				secretKey: 'bar'
			});
		});
	});

	describe('with channel secrets', function () {
		let client;
		let setItemSpec;
		let transform;
		let result;
		let error = null;
		const playlist = {id: 'foo', name: 'PLAYLIST'};
		const spec = {
			channel: 'abc',
			type: 'collectionSpec',
			id: 'spec-123',
			playlist
		};
		const videos = [{title: 'VIDEO_1'}, {title: 'VIDEO_2'}];
		const collection = {title: 'COLLECTION'};

		function getChannel() {
			return Promise.resolve({
				id: 'abc',
				secrets: {
					apiKey: 'api-key-foo',
					secretKey: 'api-secret-bar'
				}
			});
		}

		beforeAll(function (done) {
			const bus = this.createBus();

			// Mock the Oddworks setItemSpec command for the related assets (videos).
			setItemSpec = jasmine
				.createSpy('setItemSpec')
				.and.returnValues(
					Promise.resolve({type: 'videoSpec', resource: 'foo-123'}),
					Promise.resolve({type: 'videoSpec', resource: 'bar-123'})
				);

			bus.commandHandler({role: 'catalog', cmd: 'setItemSpec'}, setItemSpec);

			// Mock the jwplayer client methods.
			client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
			spyOn(client, 'getPlaylist').and.returnValue(Promise.resolve(playlist));
			spyOn(client, 'getVideosByPlaylist').and.returnValue(Promise.resolve(videos));

			transform = jasmine.createSpy('transform').and.returnValue(collection);

			const playlistHandler = provider.createPlaylistHandler(bus, getChannel, client, transform);

			return playlistHandler({spec})
				.then(res => {
					result = res;
				})
				.catch(err => {
					error = err;
				})
				.then(done);
		});

		it('has a result', function () {
			expect(result.title).toBe('COLLECTION');
		});

		it('does not have an error', function () {
			expect(error).toBe(null);
		});

		it('sends setItemSpec commands', function () {
			expect(setItemSpec).toHaveBeenCalledTimes(2);
			expect(setItemSpec).toHaveBeenCalledWith({
				channel: 'abc',
				type: 'videoSpec',
				source: 'jwplayer-video-provider',
				video: videos[0]
			});
			expect(setItemSpec).toHaveBeenCalledWith({
				channel: 'abc',
				type: 'videoSpec',
				source: 'jwplayer-video-provider',
				video: videos[1]
			});
		});

		it('calls client.getPlaylist()', function () {
			expect(client.getPlaylist).toHaveBeenCalledTimes(1);
			expect(client.getPlaylist).toHaveBeenCalledWith({
				playlistId: 'foo',
				apiKey: 'api-key-foo',
				secretKey: 'api-secret-bar'
			});
		});

		it('calls client.getVideosByPlaylist()', function () {
			expect(client.getVideosByPlaylist).toHaveBeenCalledTimes(1);
			expect(client.getVideosByPlaylist).toHaveBeenCalledWith({
				playlistId: 'foo',
				apiKey: 'api-key-foo',
				secretKey: 'api-secret-bar'
			});
		});
	});
});
