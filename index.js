const url = require("url");

const getFile = require("./api/fileApi").getFile;
const postFile = require("./api/fileApi").postFile;
const deleteFile = require("./api/fileApi").deleteFile;

require("http")
  .createServer(function(req, res) {
    // if (filename.includes('/') || filename.includes('..')) {
    //   res.statusCode = 400;
    //   res.end('Nested paths are not allowed');
    //   return;
    // }

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
  })
  .listen(3000);

console.log("The server is running on port 3000");