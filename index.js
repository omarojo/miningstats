/*********************************/
/* MODULES DEPENDENCIES */
console.log("Server Running :::");
var request = require("request"); //Used to make POSTs GETs requests internally

// SERVER variables
var express = require("express");
var cors = require("cors"); //CROSS DOMAIN REQUESTS
var path = require("path");

// Bootstrap express
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

server.listen(process.env.PORT || 8000);

//app.use(bodyParser());

//CONFIGURE
//app.use(express.static(__dirname + '/public'));
app.use("/public", express.static(path.join(__dirname, "/public")));
app.use("/css", express.static(path.join(__dirname, "/public/css")));
app.use("/js", express.static(path.join(__dirname, "/public/js")));
app.use("/img", express.static(path.join(__dirname, "/public/img")));

//CROSS DOMAIN
app.use(cors());
var timeRequestLimit = 0; //minutes
var previousDate = new Date("05/23/2021 16:20:00");

let lastFetchedData;

let rigsReference = [
  "Rig1",
  // "Rig2",
  // "Rig3",
  // "Rig4",
  "Rig5",
  "Rig6",
  // "Rig7",
  "Rig8",
  "Rig9",
  // "Rig10",
  "Rig11",
  "Rig12",
  // "Rig13",
  "Rig14",
  "Rig15",
  "Rig16",
  "Rig17",
  "Rig18",
  "Rig19",
  "Rig20",
  "Rig21",
  "Rig22",
  "Rig23",
  "Rig24",
  "Rig25",
  "Rig26",
  "Rig27",
  "Rig28",
  "Rig29",
  "Rig30",
];

differenceBetweenDates(previousDate);
function differenceBetweenDates(prevDate) {
  var nowDate = new Date();
  console.log("now:" + nowDate);
  console.log("previous" + prevDate);
  var Difference_In_Time = nowDate.getTime() - prevDate.getTime();
  var Difference_In_Minutes = Difference_In_Time / (1000 * 60);

  console.log(
    "Elapsed time since last request: " + Difference_In_Minutes + "mins"
  );
  return Difference_In_Minutes;
}

// ******************************************
// Bridge GET URLS
// Use this to request for Unminable formated data
// ******************************************
app.route("/stats/").get(function (req, res, next) {
  request(
    "https://api.unminable.com/v5/account/8cb74bda-b7a2-4fdc-a624-4d54940719ca/stats",
    function (error, response, statsBody) {
      //If elapsed time between now and last request is not higher than timeRequestLimit.. then send back the old result.
      var elapsedTimeSinceLastRequest = differenceBetweenDates(previousDate);
      if (elapsedTimeSinceLastRequest < timeRequestLimit) {
        res.status(200).send(lametricFormat_Today);
        return;
      }
      var stats = JSON.parse(statsBody);
      console.log(stats);
      res.status(200).send(stats);
    }
  );
});
app.route("/workers/").get(function (req, res, next) {
  request(
    "https://api.unminable.com/v5/account/8cb74bda-b7a2-4fdc-a624-4d54940719ca/workers",
    function (error, response, statsBody) {
      //If elapsed time between now and last request is not higher than timeRequestLimit.. then send back the old result.
      var elapsedTimeSinceLastRequest = differenceBetweenDates(previousDate);
      if (elapsedTimeSinceLastRequest < timeRequestLimit) {
        res.status(200).send(lastFetchedData);
        return;
      }
      var stats = JSON.parse(statsBody);
      var onlineRigs = [];
      var offlineRigs = [];
      var offlineRigsString = "";
      stats.data.zhash.workers.forEach((r) => {
        if (r.online == true) {
          onlineRigs.push(r.name);
        }
      });
      stats.data.xelishash.workers.forEach((r) => {
        if (r.online == true) {
          onlineRigs.push(r.name);
        }
      });
      offlineRigs = rigsReference.filter((item) => !onlineRigs.includes(item));
      offlineRigs.forEach((r) => {
        offlineRigsString = offlineRigsString.concat(r + ", ");
      });
      console.log(offlineRigsString);
      var workers = {
        onlineCount: onlineRigs.length,
        onlineRigs: onlineRigs,
        offlineRigs: offlineRigs,
        offlineCount: offlineRigs.length,
        offlineRingsString: offlineRigsString,
      };
      lastFetchedData = workers;
      //stats.data.zhash.workers
      res.status(200).send(workers);
    }
  );
});
// ******************************************
// SOCKETS Management and URL Routes
// LEARN sintax http://stackoverflow.com/questions/32674391/io-emit-vs-socket-emit
// ******************************************
io.sockets.on("connection", function (socket) {
  console.log(">>>>>>> Someone connected");
  //Telling the client that he is connected and asking for a room to connect.
  io.to(socket.id).emit("connected", "Hola, you are connected !");

  socket.on("join", function (room) {
    socket.join(room);
    console.log(">> Someone Joined Room: " + room);
  });

  socket.on("touchDrag", function (data) {
    console.log(">> Pointer: " + data);
    socket.broadcast.emit("oscPointer", data);
  });

  //El socket conectado se ha desconectado
  socket.once("disconnect", function () {
    console.log(">>>>>> Someone Disconnected");
  });
});
