///PROBLEM = VERILERI VARIABLE OLARAK ALAMIYORUM, STATE-PENTING BITMEDEN VALUE ALAMIYORUM

function lastFM(data, callback) {
  return reqwest({
    url: "https://ws.audioscrobbler.com/2.0/",
    data: data,
    type: "xml",
    success: function (data) {
      if (callback) {
        callback(false, data);
      }
    },
    error: function (err) {
      if (callback) {
        callback(err);
      }
    },
  });
}

function requestData(api_key, user, page) {
  return {
    method: "user.getrecenttracks",
    user: user,
    api_key: api_key,
    limit: 200,
    page: page || 1,
  };
}

function requestList(api_key, user, page_count) {
  var requests = [];
  for (var page = 1; page <= page_count; page++) {
    requests.push(requestData(api_key, user, page));
  }
  return requests;
}

function extractTracks(doc) {
  var arr = [];
  var track, obj, child;
  var tracks = doc.evaluate(
    "lfm/recenttracks/track",
    doc,
    null,
    XPathResult.ANY_TYPE,
    null
  );
  while ((track = tracks.iterateNext())) {
    obj = {};
    for (var i = track.childNodes.length - 1; i >= 0; i--) {
      child = track.childNodes[i];
      obj[child.tagName] = child.textContent;
    }
    arr.push(obj);
  }

  return arr;
}

function extractPageCount(doc) {
  var recenttracks = doc
    .evaluate("lfm/recenttracks", doc, null, XPathResult.ANY_TYPE, null)
    .iterateNext();
  return parseInt(recenttracks.getAttribute("totalPages"), 10);
}

function row(keys, obj) {
  return keys.map(function (k) {
    return obj[k];
  });
}

function csv(array) {
  return array
    .map(function (item) {
      return typeof item === "string" ? item.replace(/[\",]/g, "") : item;
    })
    .join(",");
}

function delay(fn, millis) {
  return function () {
    var args = [].slice.call(arguments);
    setTimeout.apply(this, [fn, millis].concat(args));
  };
}

function get_data(data) {
  console.log("get_datanin icindeyim");
}

function basla() {
  data = [];

  (key = "974a5ebc077564f72bd639d122479d4b"), (user = "ahmetyildirim");

  lastFM(requestData(key, user))
    .fail(function (err, msg) {
      console.log("zortladim");
    })
    .then(extractPageCount)
    .then(function (page_count) {
      console.log("ayaktayim");
      var current = 0;

      var requests = requestList(key, user, page_count).map(function (r, i) {
        return {
          data: r,
          i: i,
        };
      });

      async.eachSeries(
        requests,
        function (item, callback) {
          if (false) return callback(false); //burdan olmuyor

          lastFM(item.data)
            .then(extractTracks)
            .then(function (tracks) {
              var blb = new Blob([
                tracks
                  .map(function (d) {
                    return row(["artist", "album", "name", "date"], d);
                  })
                  .map(csv)
                  .join("\n") + "\n",
              ]);
              data[item.i] = blb;
            })

            .fail(function () {
              console.log("fail");
            })
            .always(function () {
              setTimeout(callback, false);
            });
        },
        () => {
          console.log("bitti.");
          console.log(data[0].text()); //bu fucking promise'nin içindeki valueyi bu asenkron fonksiyonun dışına almam lazim.

          var b = new Blob(data, { type: "text/csv" });
        }
      );
    });
}

//zort
