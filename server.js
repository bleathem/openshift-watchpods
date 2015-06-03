var request = require('request')
  , split = require('split')
  ;

var options = {
  url: 'https://' + process.env.SERVER + '/api/v1beta3/watch/namespaces/' + process.env.NAMESPACE + '/pods',
  auth: { bearer: process.env.TOKEN },
  method: 'get',
  qs: {},
  rejectUnauthorized: false,
  strictSSL: false,
};

var connect = function(callback) {
  console.log(options);
  var stream = request(options).pipe(split());
  console.log(new Date(), 'Connecting');
  stream.on('response', function(error) {
    //do nothing
  });
  stream.on('data', function(data) {
    try {
      var json = JSON.parse(data);
      // store the most recent resourceVersion
      if (json.object.metadata.resourceVersion) {
        options.lastResourceVersion = json.object.metadata.resourceVersion;
      };
    } catch(e) {
      // parse exception likely due to stream terminating.  Log and continue.
      console.log(e);
      // console.log(data.toString());
    }
  });
  stream.on('error', function(error) {
    console.log(tag, 'error:',error);
    callback(error);
  });
  stream.on('end', function() {
    callback({type: 'end', msg: 'Request terminated.'});
  });
};

var retry = true
  , count = 0;

var myCallback = function(error) {
  retry = error.type === 'end';
  if (retry) {
    console.log('Stream terminated, re-connecting. Attempt (', count++, ')');
    if (options.lastResourceVersion) {
      options.qs.resourceVersion = options.lastResourceVersion; // get only updates
    };
    connect(myCallback);
  }
}

connect(myCallback);
