process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * CONFIGURACIONES REQUERIDAS
 */
//la BD
var mongoose = require('./config/mongoose');
//la app
var express = require('./config/express');
//autentificacion
var passport = require('./config/passport');

/**
 * CREAR APP Y SERVIR
 */
var db = mongoose();
var app = express();
var passport = passport();
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
app.listen(port, ip);
module.exports = app;

console.log('OK! Servidor ejecutándose ' + ip + ':' + port);