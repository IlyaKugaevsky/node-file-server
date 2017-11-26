const getFile = require("./api/fileApi").getFile;
const postFile = require("./api/fileApi").postFile;
const deleteFile = require("./api/fileApi").deleteFile;

require("http")
  .createServer(function(req, res) {

    switch (req.method) {
      case "GET":
        getFile(req, res);
        break;
      case "POST":
        postFile(req, res);
        break;
      case "DELETE":
        deleteFile(req, res);
        break;
      default:
        res.end("No action specified");
        break;
    }
  });