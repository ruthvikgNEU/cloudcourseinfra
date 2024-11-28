const db = require('../models')
const bcrypt = require('bcrypt')
const sequelize  = require('../models/index')
const User = db.users
const logger = require('../logger');
const SDC = require('node-statsd');
const sdc = new SDC({
    host: "localhost",
    port: "8125"
});
console.log("Testing");
// POST route to add a new user to database
const addUser = async (req, res) => {
    // checks if request body exists, if not returns a bad request
    sdc.increment('Add_User')
    if(Object.keys(req.body).length === 0){
        return res.status(400).send('Bad request')
    }

    // if any of the required fields are empty, return a bad request
    if(req.body.first_name == null || req.body.last_name == null || req.body.username == null || req.body.password == null){
        return res.status(400).send('Bad request')
    }

    // retrieves attribute values from request body
    var first_name = req.body.first_name
    var last_name = req.body.last_name
    var username = req.body.username
    var password = req.body.password
    var dateObj = new Date()
    var date = dateObj.toJSON()

    // regex to check for valid username (email)
    var usernameCheck = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    var checkIfExists = await User.findOne({where: { username: username }})

    // hash the user password with a salt value of 10
    var hash = await bcrypt.hash(password, 10)

    console.log(username.match(usernameCheck))
    console.log(checkIfExists)
    // if username does not exist and all entered values are valid, a new user is created and their details are returned with the corresponding status code
    if(checkIfExists == null && username.match(usernameCheck)){
        // create user info to store into database
        let userInfo = {
            first_name: first_name,
            last_name: last_name,
            username: username,
            password: hash,
            account_created: date,
            account_updated: date
        }

        // creates new user and returns select details
        await User.create(userInfo)
        // finds newly created user to fetch info
        let response = await User.findOne({where: { username: username },
            attributes: { exclude: [ 'password', 'createdAt', 'updatedAt' ]}})  
            logger.info("User Create Attempt Success UserId:"+response.id)
        return res.status(201).send(response)
    }

    // if above checks fail, a bad request is returned
    logger.info("User Create Attempt Failed") 
    return res.status(400).send('User Not Created')
}

// GET route to retrieve user details
const getUser = async (req, res) => {
    // checks for authorization header
    sdc.increment('Get_User')
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }
    // authorization check
    const authenticated = await authenticate(req)
    if(authenticated == true){
        // retrieve user details on successful authentication
        let user = await User.findOne({where: { id: req.params.id },
            attributes: { exclude: [ 'password', 'createdAt', 'updatedAt' ]}})
        if(user != null){
            logger.info("User Get Attempt Success UserId: "+req.params.id)   
            return res.status(200).send(user)
        }
        // user does not exist
        return res.status(403).send('Forbidden')
    }
    logger.info("User Get Attempt Failed") 
    return res.status(403).send('Forbidden')
}










// PUT route to update user details
const updateUser = async (req, res) => {
    sdc.increment('Update_User')
    if(Object.keys(req.body).length == 3){
    if(!req.body.first_name || !req.body.last_name || !req.body.password){
        return res.status(400).json("Bad Request")
    }
    
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }
    
    // attempt to update any other field should return 400 Bad Request HTTP response code
    if(!req.body.username && !req.body.account_created && !req.body.account_updated)
    {
        const authenticated = await authenticate(req)
        if(authenticated == true){
            var password = req.body.password
            // hash the user password with a salt value of 10
                const hash = await bcrypt.hash(password, 10)

            // update user
            const user = await User.update({first_name: req.body.first_name, last_name: req.body.last_name, password: hash, account_updated: new Date().toJSON()}, {where: { id: req.params.id }})
            if(user == 1){
                logger.info("User Update Attempt Success UserId:"+req.params.id) 
                return res.status(204).send(user)
            }
            logger.info("User Update Attempt Failed")
                return res.status(400).send('Bad request')
        }
        logger.info("User Update Attempt Failed")
            return res.status(403).send('Forbidden')
    }
    logger.info("User Update Attempt Failed") 
    return res.status(400).send('Bad request')
}
else{
    logger.info("User Update Attempt Failed")
    return res.status(400).send('Bad request')
}
}

// function to authenticate a user
async function authenticate (req) {
    // decodes authorization header to fetch username and password
    sdc.increment('User_Authentication')
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
    var username = credentials[0]
    var password = credentials[1]

    // finding the user with specified username
    let user = await User.findOne({where: { username: username }})

    //compares user id passed to that of user id found via username passed
    if(user != null && user.id == req.params.id){
        // compare user password with stored hash
        logger.info("User Authenticated UserId: "+user.id)
        const authenticated = await bcrypt.compare(password, user.password)
        return authenticated
    }
    return false
}

// function to check if server is healthy
const getStatus = (req,res) => {
    sequelize.sequelize
  .authenticate()
  .then(() => {
    sdc.increment('Healthz');
    logger.info("Healthz has been Hit");
    res.send('Connection has been established successfully.');
    
  })
  .catch(err => {
    res.send('Unable to connect to the database:', err);
  })
}

const getNortheastern = (req,res) => {
    sequelize.sequelize
  .authenticate()
  .then(() => {
    sdc.increment('neu');
    logger.info("NEU has been hit");
    res.send('Northeastern University Has been hit.');
    
  })
  .catch(err => {
    res.send('Unable to connect to the database:', err);
  })
}

const invalidRoute = (req,res) => {
    return res.status(401).send('Route Not Found');
}

module.exports = {
    addUser,
    getUser,
    updateUser,
    getStatus,
    invalidRoute,
    getNortheastern
}