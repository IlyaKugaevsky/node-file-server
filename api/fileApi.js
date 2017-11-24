const url = require("url");
const fs = require("fs");
const path = require("path");

const root = path.dirname(require.main.filename);

getFile = (req, res) => {

  let fullPath = createPath(req);
  let file = new fs.ReadStream(fullPath);
  file.pipe(res);

  file.on("error", err => {
    if (err.code === "ENOENT") {
      res.end("File not found");
      res.statusCode = 404;
    } else {
      res.end("Internal error");
      res.statusCode = 500;
    }
    console.log(err);
  });

  res.on("close", () => {
    file.destroy();
  });
};

postFile = (req, res) => {
  const fileSizeLimit = 1000000;

  if (req.headers["content-length"] > fileSizeLimit) {
    res.end("File size should be less than 1Mb");
    res.statusCode = 413;
  } else {
    let fullPath = createPath(req);

    if (fs.existsSync(fullPath)) {
      res.end("File already exists");
      res.statusCode = 409;
    } else {
      let file = new fs.WriteStream(fullPath);

      req.pipe(file);
      res.end("File has been uploaded");

      file.on(error, (err) => {
        console.log(err);
        res.end("Internal error");
        res.statusCode = 500;
      })

      res.on("close", () => {
        file.destroy();
      });
    }
  }
};

deleteFile = (req, res) => {
  
}

createPath = req => {
  let pathname = decodeURI(url.parse(req.url).pathname);
  return path.join(root, "/files", pathname.substring(1));
};

module.exports.getFile = getFile;
module.exports.postFile = postFile;
