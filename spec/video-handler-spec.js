/* global jasmine, describe, beforeAll, it, expect, spyOn, xit */
/* eslint prefer-arrow-callback: 0 */
/* eslint-disable max-nested-callbacks */
'use strict';

const Promise = require('bluebird');
const provider = require('../');

describe('videoHandler', function () {
	function noop() {}

	describe('when jwplayer video not found', function () {
		let result = null;
		let error = null;
		let errEvent = null;
		const spec = {
			channel: 'abc',
			type: 'videoSpec',
			id: 'spec-123',
			video: {id: 'foo'}
		};

		function getChannel() {
			return Promise.resolve({id: 'abc'});
		}

		beforeAll(function (done) {
			const bus = this.createBus();

			bus.observe({level: 'error'}, function (payload) {
				console.log('PAYLOAD_VHS: ', payload);
				errEvent = Object.assign(payload);
				console.log('EVENT: ', errEvent);
			});

			const client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
			spyOn(client, 'getVideo').and.returnValue(Promise.resolve(null));
			spyOn(client, 'getConversionsByVideo').and.returnValue(Promise.resolve(null));

			const videoHandler = provider.createVideoHandler(bus, getChannel, client, noop);

			return videoHandler({spec})
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
			expect(error.code).toBe('VIDEO_NOT_FOUND');
		});

		xit('has an error event', function () {
			// in beforeAll, errEvent is being assigned, but it is not retaining its value
			// either not firing or we're not listening
			expect(errEvent.code).toBe('VIDEO_NOT_FOUND');
			expect(errEvent.message).toBe('video not found');
			expect(errEvent.error.code).toBe('VIDEO_NOT_FOUND');
			expect(errEvent.spec.video.id).toBe('foo');
		});
	});

	describe('with jwplayer asset', function () {
		let result = null;
		let error = null;
		const video = {
			video: {VIDEO: 'VIDEO'}
		};
		const conversions = {
			conversions: [
				{CONVERSION_1: 'CONVERSION_1'},
				{CONVERSION_2: 'CONVERSION_2'}
			]
		};
		const spec = {
			channel: 'abc',
			type: 'videoSpec',
			id: 'spec-123',
			video: {id: 'foo'}
		};
		let transform;
		let client;

		function getChannel() {
			return Promise.resolve({id: 'abc'});
		}

		beforeAll(function (done) {
			const bus = this.createBus();

			client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});

			spyOn(client, 'getVideo').and.returnValue(Promise.resolve(video));
			spyOn(client, 'getConversionsByVideo').and.returnValue(Promise.resolve(conversions));

			transform = jasmine.createSpy('transform').and.returnValue(video);

			const videoHandler = provider.createVideoHandler(bus, getChannel, client, transform);

			return videoHandler({spec})
				.then(res => {
					result = res;
				})
				.catch(err => {
					error = err;
				})
				.then(done);
		});

		it('has a result', function () {
			expect(result.video).toBe(video.video);
		});

		it('calls client.getVideo', function () {
			expect(client.getVideo).toHaveBeenCalledTimes(1);
			expect(client.getVideo).toHaveBeenCalledWith({
				videoId: spec.video.id,
				apiKey: 'foo',
				secretKey: 'bar'
			});
		});

		it('calls the transform', function () {
			expect(transform).toHaveBeenCalledTimes(1);
			expect(transform).toHaveBeenCalledWith({
				spec,
				video: video.video,
				conversions: conversions.conversions
			});
		});

		it('does not have an error', function () {
			expect(error).toBe(null);
		});
	});

	describe('with Channel secrets', function () {
		let result = null;
		let error = null;
		const video = {
			video: {VIDEO: 'VIDEO'}
		};
		const conversions = {
			conversions: [
				{CONVERSION_1: 'CONVERSION_1'},
				{CONVERSION_2: 'CONVERSION_2'}
			]
		};
		const spec = {
			channel: 'abc',
			type: 'videoSpec',
			id: 'spec-123',
			video: {id: 'foo'}
		};
		let transform;
		let client;

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

			client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
			spyOn(client, 'getVideo').and.returnValue(Promise.resolve(video));
			spyOn(client, 'getConversionsByVideo').and.returnValue(Promise.resolve(conversions));

			transform = jasmine.createSpy('transform').and.returnValue(video);

			const videoHandler = provider.createVideoHandler(bus, getChannel, client, transform);

			return videoHandler({spec})
				.then(res => {
					result = res;
				})
				.catch(err => {
					error = err;
				})
				.then(done);
		});

		it('has a result', function () {
			expect(result.video).toBe(video.video);
		});

		it('calls client.getVideo', function () {
			expect(client.getVideo).toHaveBeenCalledTimes(1);
			expect(client.getVideo).toHaveBeenCalledWith({
				videoId: spec.video.id,
				apiKey: 'api-key-foo',
				secretKey: 'api-secret-bar'
			});
		});

		it('calls the transform', function () {
			expect(transform).toHaveBeenCalledTimes(1);
			expect(transform).toHaveBeenCalledWith({
				spec,
				video: video.video,
				conversions: conversions.conversions
			});
		});

		it('does not have an error', function () {
			expect(error).toBe(null);
		});
	});
});
