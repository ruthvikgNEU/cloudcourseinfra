var winston = require('winston');
const os = require('os');

var options = {
  file: {
    level: 'info',
    filename: `home/ec2-user/webapp-main/combined.log`,    
  },
}
const logger = winston.createLogger({

  level: 'info',

  format: winston.format.combine(

    winston.format.timestamp(),

    winston.format.printf(info => {

      const hostname = os.hostname();

      const logObj = {

        hostname,

        level: info.level,

        message: info.message

      };

      return JSON.stringify(logObj);

    })

  ),

  transports: [

    new winston.transports.Console(),

    new winston.transports.File(options.file)

  ]

});

module.exports = logger;