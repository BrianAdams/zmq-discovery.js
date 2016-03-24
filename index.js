/*
  This abstraction presents the Socket.io (and potentially other
  transports) as an EventEmiiter.  It takes care of forwarding
  the messages between the emitter and the message transport.
  API:
  To have the history sent, prefix the topic name that is being
  subscribed to with 'withHistory'.
*/

  var zmqDiscovery = function(zmq,discoveryUrl){
    this.subTopics={};
    this.publishers={};
    //Register for service announcements
    this.socket = zmq.socket('sub');
    this.pubsock = zmq.socket('pub');
    this.discoveryUrl = discoveryUrl;

    var self = this;

    this.socket.on('message',function(topic,message){
      message = JSON.parse(message.toString());
      topic = topic.toString();
      switch(topic){
        case 'serviceUp':
          self.AddOrRenewPublisher(message);
          break;
        case 'serviceDown':
          self.RemovePublisher(message);
          break;
      }

    });

    //Filter for Topics in subTopics
    //If Already subscribed, ignore
    //If Not subscribed, subscribe
  }
  var util = require('util');
  var EventEmitter = require('events').EventEmitter;
  util.inherits(zmqDiscovery, EventEmitter);

  zmqDiscovery.prototype.connect = function connect(callback) {
    var self = this;
    this.socket.connect(this.discoveryUrl);
    this.socket.subscribe('');
    console.log("Subscribed to serviceUp");
    console.log(typeof(callback));

    this.pubsock.bind(this.discoveryUrl,function(err){
      console.log('in bind')
      if (err) {
        console.log('bind error, falling back to connect');
        self.pubsock.connect(self.discoveryUrl);
      }
      if (typeof(callback)== 'function'){
        console.log('callback')
        callback();
      };
    });

  };


  zmqDiscovery.prototype.RemovePublisher = function RemovePublisher(message) {
    delete this.publishers[message.UID];
  };

  zmqDiscovery.prototype.AddOrRenewPublisher = function AddOrRenewPublisher(message) {
    this.publishers[message.UID]=message;
    console.log(message);
  };

  zmqDiscovery.prototype.close = function close(){
    this.socket.close();
    this.pubsock.close();
  }

  zmqDiscovery.prototype.resolve = function resolve(filter){
    var publishers=this.publishers;
    return Object.keys(this.publishers)
    .map(function(key){return publishers[key];})
    .filter(
      function(item){
        return item.topic===filter;
      }
    );
  }

  //http://byronsalau.com/blog/how-to-create-a-guid-uuid-in-javascript/
  function createGuid()
  {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
          return v.toString(16);
      });
  }

  zmqDiscovery.prototype.announce = function announce(topic,URI,options){
    if (options === undefined){options = {}};
    var announcement = {};
    announcement.UID = createGuid();
    announcement.TTL = typeof options.TTL !== 'undefined' ?  options.TTL : 1000;;
    announcement.topic = topic;
    announcement.URI = URI;
    this.pubsock.send(['serviceUp',JSON.stringify(announcement)]);
    var pubsock = this.pubsock;
    var announcementHandle = setInterval(function(){
        pubsock.send(['serviceUp',JSON.stringify(announcement)]);
    },announcement.TTL);
  }

  module.exports = function(zmq,discoveryUrl){

    return new zmqDiscovery(zmq,discoveryUrl);
  }
