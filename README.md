# [WIP] Oddworks JWPlayer Provider

An JWPlayer provider plugin for the Oddworks content server.

Installation
------------
Install the npm package as a Node.js library:

    npm install --save oddworks-jwplayer-provider

For full JWPlayer API documentation see [https://developer.jwplayer.com/jw-platform/reference/v1/](http://https://developer.jwplayer.com/jw-platform/reference/v1/).

Oddworks Server Integration
---------------------------
The Oddworks JWPlayer provider is designed to be integrated with an Oddworks server [catalog](https://github.com/oddnetworks/oddworks/tree/master/lib/services/catalog), specifically as a [provider](https://github.com/oddnetworks/oddworks/tree/master/lib/services/catalog#providers). To initialize the plugin in your server:

```JavaScript
const jwplayerProvider = require('oddworks-jwplayer-provider');

// See https://github.com/oddnetworks/oddworks/tree/master/lib/services/catalog#patterns
// for more information regarding an Oddcast Bus.
const bus = createMyOddcastBus();

const options = {
    bus: bus,
    apiKey: process.env.JWPLAYER_API_KEY,
    secretKey: process.env.JWPLAYER_SECRET_KEY
};

jwplayerProvider.initialize(options).then(provider => {
    console.log('Initialized provider "%s"', provider.name);
}).catch(err => {
    console.error(err.stack || err.message || err);
});
```

JW API credentials can also be passed in on the oddworks Channel object in the `secrets: {}` hash like so

```JavaScript
{
    type: 'channel',
    id: 'cartoon-network',
    secrets: {
        jwApiKey: '',
        jwSecretKey: ''
    }
}
```

The initialization process will attach Oddcast listeners for the following queries:

- `bus.query({role: 'provider', cmd: 'get', source: 'jwplayer-playlist-provider'})`
- `bus.query({role: 'provider', cmd: 'get', source: 'jwplayer-video-provider'})`

To use them you send Oddcast commands to save a specification object:

```JavaScript
// To create a collection based on a JWPlayer playlist:
bus.sendCommand({role: 'catalog', cmd: 'setItemSpec'}, {
    channel: 'abc',
    type: 'collectionSpec',
    source: 'jwplayer-playlist-provider',
    playlist: {id: '123456'}
});

// To create a video based on a JWPlayer video:
bus.sendCommand({role: 'catalog', cmd: 'setItemSpec'}, {
    channel: 'abc',
    type: 'videoSpec',
    source: 'jwplayer-video-provider',
    video: {id: '123456'}
});
```

JWPlayer API Client
-----------------
You can create a stand-alone API client outside of the Oddworks provider:

```JavaScript
const jwplayerProvider = require('oddworks-jwplayer-provider');

const client = jwplayerProvider.createClient({
    bus: bus,
    apiKey: process.env.jwplayer_API_KEY,
    secretKey: process.env.jwplayer_SECRET_KEY
});
```

### Client Methods
All methods return a Promise.

- `client.getPlaylists()`
- `client.getPlaylist({playlistId})`
- `client.getVideosByPlaylist({playlistId})`
- `client.getVideo({videoId})`

License
-------
Apache 2.0 © [Odd Networks](http://oddnetworks.com)
