const assert = require("chai").assert;
const request = require("request");
const fs = require("fs");

const server = require("../server");

describe('server tests', () => {
  
  let app;

  before(done => {
    app = server.listen(3000, done);
  });

  after(done => {
    app.close(done);
  });

  it('should return index.html', done => {
    /*
      1. запустить сервер (before)
      2. сделать запрос
      3. прочесть файл с диска
      4. дождаться ответа от сервера
      5. сравнить файл с диска с тем, что пришел с сервера
    */

    request('http://localhost:3000', function (error, response, body) {
      if (error) return done(error);

      const file = fs.readFileSync('public/index.html', { encoding: 'utf-8' });
      assert.equal(body, file);

      done();
    });
  });

  it('should return 404', done => {
    
    request('http://localhost:3000/blablabla.test', function (error, response) {
      if (error) return done(error);
      
      const expectedCode = 404;
      assert.equal(expectedCode, response.statusCode);

      done();
    });
  });
});
