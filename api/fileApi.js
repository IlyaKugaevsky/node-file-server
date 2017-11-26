const url = require("url");
const fs = require("fs");
const path = require("path");
const mime = require("mime");
const config = require("../config/default");

module.exports.getFile = (req, res) => {

  const filename = getFilename(req.url);
  const fullPath = createFullPath(req.url);

  if (filename === "") {
    sendFile(config.indexPath, res);
    return;
  }
  if (!isValidFilename(filename)) {
    res.statusCode = 400;
    res.end("Nested paths are not allowed");
    return;
  }
  sendFile(fullPath, res);

};

module.exports.postFile = (req, res) => {

  if (req.headers["content-length"] > config.fileSizeLimit) {
    res.statusCode = 413;
    res.end(`File size should be less than ${config.fileSizeLimit / 1e6} Mb`);
    return;
  }
  receiveFile(req, res, config.fileSizeLimit);

};

module.exports.deleteFile = (req, res) => {

  const fullPath = createFullPath(req.url);
  fs.unlink(fullPath, (err) => {
    if (err) {
      if (err.code == "ENOENT") {
        res.statusCode = 404;
        res.end("File not found");
      }
      else {
        console.log(err);
        res.statusCode = 500;
        res.end("Internal error");
      }
    }
    else {
      res.statusCode = 200;
      res.end("File has been removed");
    }
  })
  
};

const sendFile = (fullPath, res) => {
  
  const file = new fs.ReadStream(fullPath);
  file.pipe(res);

  file.on("error", err => {
    if (err.code === "ENOENT") {
      res.statusCode = 404;
      res.end("File not found");
    } else {
      res.statusCode = 500;
      res.end("Internal error");
    }
    console.log(err);
  });

  file.on("open", () => {
    res.setHeader("Content-Type", mime.lookup(fullPath));
  });

  res.on("close", () => {
    file.destroy();
  });
};

const receiveFile = (req, res, fileSizeLimit) => {

  const fullPath = createFullPath(req.url);
  const file = new fs.WriteStream(fullPath, { flags: "wx" });

  req.pipe(file);

  let size = 0;
  req.on("data", chunk => {
    size += chunk.length;
    if (size > fileSizeLimit) {
      // early connection close before recieving the full request
      res.statusCode = 413;

      // if we just res.end w/o connection close, browser may keep on sending the file
      // the connection will be kept alive, and the browser will hang (trying to send more data)
      // this header tells node to close the connection
      // also see http://stackoverflow.com/questions/18367824/how-to-cancel-http-upload-from-data-events/18370751#18370751
      res.setHeader('Connection', 'close');

      // Some browsers will handle this as 'CONNECTION RESET' error
      res.end(`File size should be less than ${config.fileSizeLimit / 10e6} Mb`);
      destroyFile(file, fullPath);
    }
  });

  req.on("close", () => destroyFile(file, fullPath));

  file.on("error", err => {
    if (err.code === 'EEXIST') {
      res.statusCode = 409;
      res.end('File is already exists');
    } else {
      res.writeHead(500, {'Connection': 'close'});
      res.write('Internal error');
      fs.unlink(fullPath, err => { // eslint-disable-line
        res.end();
      });
    }
    console.error(err);
  });

  file.on('close', () => {
    // Note: can't use on('finish')
    // finish = data flushed, for zero files happens immediately,
    // even before 'file exists' check

    // for zero files the event sequence may be:
    //   finish -> error

    // we must use 'close' event to track if the file has really been written down
    res.end('File has been uploaded');
  });

};

const destroyFile = (file, fullPath) => {
  file.destroy();
  fs.unlink(fullPath, err => { // eslint-disable-line
    /* ignore error */
  });
}

const isValidFilename = filename =>
  (!filename.includes("/") && !filename.includes("..") && !filename === "");

const createFullPath = reqUrl =>
  path.join(config.filesRoot, getFilename(reqUrl));

const getFilename = reqUrl => 
  getPath(reqUrl).slice(1);

const getPath = reqUrl => 
  decodeURI(url.parse(reqUrl).pathname);