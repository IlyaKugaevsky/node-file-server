/**
 ЗАДАЧА - научиться работать с потоками (streams)
 Написать HTTP-сервер для загрузки и получения файлов
 - Все файлы находятся в директории files
 - Структура файлов НЕ вложенная.

 - Виды запросов к серверу
   GET /file.ext
   - выдаёт файл file.ext из директории files,

   POST /file.ext
   - пишет всё тело запроса в файл files/file.ext и выдаёт ОК
   - если файл уже есть, то выдаёт ошибку 409
   - при превышении файлом размера 1MB выдаёт ошибку 413

   DELETE /file
   - удаляет файл
   - выводит 200 OK
   - если файла нет, то ошибка 404

 Вместо file может быть любое имя файла.
 Так как поддиректорий нет, то при наличии / или .. в пути сервер должен выдавать ошибку 400.

- Сервер должен корректно обрабатывать ошибки "файл не найден" и другие (ошибка чтения файла)
- index.html или curl для тестирования

 */

// Пример простого сервера в качестве основы

"use strict";

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
  })
  .listen(3000);

console.log("server is running on port 3000");
