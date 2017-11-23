const fs = require('fs');
const path = require('path');

const root = path.dirname(require.main.filename);

getFile = (pathname, res) => {

  let fullPath = path.join(root, '/files', pathname.substring(1));
  let file = new fs.ReadStream(fullPath);

  file.pipe(res);
}

module.exports = getFile;