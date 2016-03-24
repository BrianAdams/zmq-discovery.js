zmq-discoery.js adds basic service discovery functionality over zeroMQ for node.js

It uses basic JSON messages to service registration.

Any zeroMQ client should be able to interoperate by using the same message format and sending the registrations over the same broadcast address using a pub socket, and listening for registrations using a sub socket to the same address.

Installation:
`npm install brianadams/zmq-discovery`

Messages
The only message currently supported is `serviceUp` which indicates a service is ready to be used.  It is a two part message in ZeroMQ, of [messagetype,messagedata] where messagetype is a string and message data is a json payload described as:

Message data format:
```
{ UID: '5dbc7143-62df-4e0f-bae8-97c1cbafcf9d', // UUID unique to each publishing service
  TTL: 1000, // Time to live for the registration message, assume service down if TTL expired
  topic: 'Test', // The service name
  URI: 'tcp://127.0.0.1:3334' // The URI for accessing the service
}
```

Publish a service:
```
var discoverURL = 'tcp://127.0.0.1:13331';
var zmq = require('zmq');
var zmqD = zmqDiscovery(zmq,discoverURL);

zmqD.connect();
zmqD.announce('Test','tcp://127.0.0.1:3334');
```

Get the URI for a named service:
```
var discoverURL = 'tcp://127.0.0.1:13331';
var zmq = require('zmq');
var zmqD = zmqDiscovery(zmq,discoverURL);
zmqD.connect();

zmqD.resolve('Test')[0].URI  //resolve returns an array of matching services
```


Todo:
- [ ] The tests execute but the runner does not exit.
