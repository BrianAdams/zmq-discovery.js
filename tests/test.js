var test = require('tape');
var zmqDiscovery = require('../')
var discoverURL = 'tcp://127.0.0.1:13331';

// test.skip to disable a test

test('zmqD supports eventEmitter API',function(t){
  var zmq = require('zmq');
  var zmqD = zmqDiscovery(zmq,discoverURL);
  zmqD.connect(function(){
    t.notEqual(zmqD.on,undefined,'zmq object has an on function.');
    t.ok(zmqD.emit !== undefined,'zmq object has an emit function.');
    zmqD.close();
    t.end();
  });
});

test('zmqD listens for publishers',function(t){
  var zmq = require('zmq');
  var zmqD = zmqDiscovery(zmq,discoverURL);

  var sock = zmq.socket('pub');
  sock.bindSync(discoverURL);

  zmqD.connect()
  setInterval(function(){
    sock.send(['serviceUp',JSON.stringify({UID:'00001',TTL:1000,topic:'Test',URI:'tcp://127.0.0.1:3334'})]);
  },200);
  setTimeout(function(){
    t.notEqual(zmqD.publishers['00001'],undefined);
    zmqD.close();
    sock.close();
    t.end();
  },400);

});

test('zmQD can provides URI(s) for published topics',function(t){
  var zmq = require('zmq');
  var zmqD = zmqDiscovery(zmq,discoverURL);

  var sock = zmq.socket('pub');
  sock.bindSync(discoverURL);
  zmqD.connect();

  setInterval(function(){
    sock.send(['serviceUp',JSON.stringify({UID:'00001',TTL:1000,topic:'Test',URI:'tcp://127.0.0.1:3334'})]);
    sock.send(['serviceUp',JSON.stringify({UID:'00002',TTL:1000,topic:'Test2',URI:'tcp://127.0.0.1:3335'})]);
    sock.send(['serviceUp',JSON.stringify({UID:'00004',TTL:1000,topic:'Test2',URI:'tcp://127.0.0.1:3337'})]);
    sock.send(['serviceUp',JSON.stringify({UID:'00003',TTL:1000,topic:'Different Test',URI:'tcp://127.0.0.1:3336'})]);
  },200);

  setTimeout(function(){
    t.equal(zmqD.resolve('Test')[0].URI,'tcp://127.0.0.1:3334','Correctly Resolves a Single Topic');
    t.deepLooseEqual(zmqD.resolve('Test2').map(function(reg){return reg.URI}),['tcp://127.0.0.1:3335','tcp://127.0.0.1:3337'],'Correctly Resolves a Multiple publishers to a singel topic');

    //Test cleanup
    zmqD.close();
    sock.close();
    t.end();
  },400);

});

test('zmqD can publish a service',function(t){
  var zmq = require('zmq');
  var zmqD = zmqDiscovery(zmq,discoverURL);
  zmqD.connect();

  zmqD.announce('Test','tcp://127.0.0.1:3334');
  setTimeout(function(){
    t.equal(zmqD.resolve('Test').length,1);
    zmqD.close();
    t.end();
  },1100); //1 second TTL, we miss the initial announcement and have to wait
});
