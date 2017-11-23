const fs = require('fs');
const path = require('path');

const root = path.dirname(require.main.filename);

getFile = (pathname, res) => {

  let fullPath = path.join(root, '/files', pathname.substring(1));
  let file = new fs.ReadStream(fullPath);

  file.pipe(res);

  file.on('error', (err) => {
    if (err.code === 'ENOENT') {
      res.statusCode = 404;
      res.end('File not found');  
    }
    else {
      res.statusCode = 500;
      res.end('Internal error');
    }
    console.log(err);
  })

  file
    .on('open', () => {
      console.log('open');
    })
    .on('close', () => {
      console.log('close');
    })

  res.on('close', () => {
    file.destroy();
  })
}



module.exports = getFile;