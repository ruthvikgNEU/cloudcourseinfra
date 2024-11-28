const db = require('../models')
const sequelize  = require('../models/index')
const Product = db.products
const User = db.users
const Image = db.images
const bcrypt = require('bcrypt')
const  validator = require('validator')
const Ajv = require('ajv')
const logger = require('../logger');
const SDC = require('node-statsd');
const sdc = new SDC({
    host: "localhost",
    port: "8125"
});

const S3 = require('aws-sdk/clients/s3')

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const s3 = new S3({
    region
});

const addProduct = async (req, res) => {
    // checks if request body exists, if not returns a bad request
    sdc.increment('Add_Product')
    if(Object.keys(req.body).length == 0){
        logger.info("Add Product Failed for UserId: "+userId)
        return res.status(400).send('Input Empty')
    }
    
    if(!req.get('Authorization')){
        logger.info("Add Product Failed for UserId: "+userId)
        return res.status(401).send('Select Basic Authorization')
    }
    if(!isAuthDetails(req)){
        console.log(req.get('Authorization'))
        logger.info("Add Product Failed for UserId: "+userId)
        return res.status(401).send('Email or Password Missing')
    }
    var authenticated4 = await authenticate(req)
    if(authenticated4 != true){
        logger.info("Add Product Failed for UserId: "+userId)
        return res.status(403).send('Invalid Username Password')
    }
    if(Object.keys(req.body).length != 5){
        logger.info("Add Product Failed for UserId: "+userId)
        return res.status(400).send('Invalid Number of Input Parameters')
    }
    if(validateSchema(req)){
    var name = req.body.name
    var description = req.body.description
    var manufacturer = req.body.manufacturer
    var sku = req.body.sku
    var quantity = req.body.quantity
    var dateObj = new Date()
    var date = dateObj.toJSON()
    var checkIfExists = await Product.findOne({where: { name: name, sku: sku, owner_user_id: userId }})
    if(checkIfExists != null)
    return res.status(400).send('Product Already Present')
    
        if(authenticated4 == true){
            let product_info = {
                name: name,
                description: description,
                sku: sku,
                manufacturer: manufacturer,
                quantity: quantity,
                date_added: date,
                date_last_updated: date,
                owner_user_id: userId
            }
            let productx = await Product.findAll({where: {sku: sku}});
            if(productx.length != 0){
                // product does not exist
                logger.info("Add Product Failed for UserId: "+userId)
            return res.status(400).send('Invalid Product Sku')
            }
            try{
            var product = await Product.build(product_info)
            await product.validate();
            await product.save(); 
            logger.info("Add Product Success for UserId: "+userId)
            return res.status(201).send(product)
            }
            catch(e){
                console.error(e);
            }
        }
    }
    logger.info("Add Product Failed for UserId: "+userId)
    return res.status(400).send('Invalid Input Parameters')
}
var userId = -1;
async function authenticate (req) {
    // decodes authorization header to fetch username and password
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
    var username = credentials[0]
    var password = credentials[1]
  
      // finding the user with specified username
    let user = await User.findOne({where: { username: username }})

    //compares user id passed to that of user id found via username passed
    if(user != null){
        // compare user password with stored hash
        const authenticated = await bcrypt.compare(password, user.password)
        userId = user.id;
        return authenticated
    }
    return false
}

function validateSchema(req){
    const schema = {
        type: 'object',
        properties: {
        name: {type: 'string'},
        description: {type: 'string'},
        sku: {type: 'string'},
        manufacturer: {type: 'string'},
        quantity: {type: 'integer'}
        },
        additionalProperties: false
        }
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const valid = validate(req.body)
    return valid;
}

const getProduct = async (req,res) => {
        // retrieve product details(public method)
        sdc.increment('Get_Product')
        let product = await Product.findAll({where: {id: req.params.id}});
        if(Object.keys(product).length != 0){
            logger.info("Get Product Success for ProductId: "+req.params.id)
            return res.status(200).send(product[0])
        }
        // product does not exist
        logger.info("Get Product Failed for ProductId: "+req.params.id)
        return res.status(401).send('Invalid Product Id')
}
const deleteProduct = async (req,res) => {
    sdc.increment('Delete_Product')
    if(!req.get('Authorization')){
        return res.status(401).send('Select Basic Authorization')
    }
    var authenticated1 = await authenticate(req)
    if(authenticated1 != true){
        return res.status(403).send('Invalid Username and Password')
    }
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
    var username = credentials[0]
    
    // finding the user with specified username
    let user = await User.findAll({where: { username: username }})
    console.log(user);
    let product = await Product.findAll({where : { id: req.params.id  }})
    console.log(product);
   if(Object.keys(product).length == 0){
    // given product id not found irrespective of user
   return res.status(400).send('Invalid Product Id')
   }
    if(user!= null && product != null){
        if(user[0]['dataValues']['id'] == product[0]['dataValues']['owner_user_id'] ){
            logger.info("Delete Product Success for ProductId: "+req.params.id)
            Product.destroy({where: {id: req.params.id}})
            //product deleted 

            //images deleting code
            const prefix = req.params.id + '/'

            const deleteObjectsParams = {
                Bucket: bucketName,
                Delete: {
                  Objects: []
                }
            }

            const listObjectsParams = {
                Bucket: bucketName,
                Prefix: prefix
            }

            s3.listObjectsV2(listObjectsParams, function(err, data) {
                if (err) {
                  console.log(err, err.stack);
                  return;
                }
                deleteObjectsParams.Delete.Objects = data.Contents.map(function(content) {
                    return {Key: content.Key};
                })
                s3.deleteObjects(deleteObjectsParams, function(err, data) {
                    if (err) {
                      console.log(err, err.stack);
                    } else {
                      console.log("Deleted objects:", data.Deleted);
                    }
                  })
                })
            //images deleting code

            res.status(204).send('Product Deleted Successfully')
        }else{
            // owner_id and user id does not match
            logger.info("Delete Product Failed for ProductId: "+req.params.id)
            res.status(403).send('Forbidden Access Cannot Delete Product')
        }
    }
    else{
        res.status(401).send('Invalid Authorization')
    }
}
const patchProduct = async (req,res) => {
    sdc.increment('Patch_Product')
        if(!req.get('Authorization')){
            return res.status(401).send('Authorization Not present')
        }
        if(!isAuthDetails(req)){
            console.log(req.get('Authorization'))
            return res.status(401).send('Email or Password Missing')
        }
        var authenticated2 = await authenticate(req)
            if(authenticated2 != true){
                return res.status(403).send('Invalid Username and Password')
            }
        if(Object.keys(req.body).length != 5){
            return res.status(400).send('Invalid Input')
        } 
        if(!validateSchema(req)){
            return res.status(400).send('Invalid Input Parameters')
        }
            let product2 = await Product.findAll({where: {id: req.params.id}});
            if(product2.length == 0){
                // product does not exist
                logger.info("Patch Product Failed for ProductId: "+req.params.id)
            return res.status(400).send('Invalid Product Id')
            }

            try{
              let flag =   validateSchema(req)
            }
            catch{
                return res.status(400).send('Invalid Input Parameters')
            }
        let productx = await Product.findOne({where: {sku: req.body.sku}});
        console.log(productx)
            if(productx != null){


                // product does not exist
            return res.status(400).send('Product Sku Already Present')
            }
        var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
        var username = credentials[0]
        // finding the user with specified username
        let user = await User.findAll({where: { username: username }})

        if(user!= null && product2 != null){
            if(user[0]['dataValues']['id'] == product2[0]['dataValues']['owner_user_id'] ){
                updateProductInfo(req.params.id,req.body,res);
            }else{
                // owner_id and user id does not match
                res.status(403).send('Forbidden Access Cannot Update Product')
            }
        }
}
function isAuthDetails(req){
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
    var username = credentials[0]
    var password = credentials[1]
    if(username != '' && password != '')
    return true;
    return false;
}

const updateProduct = async (req,res) => {
    sdc.increment('Put_Product')
    if(!req.get('Authorization')){
        return res.status(401).send('Authorization Not present')
    }
    if(!isAuthDetails(req)){
        console.log(req.get('Authorization'))
        return res.status(401).send('Email or Password Missing')
    }
    var authenticated3 = await authenticate(req)
        if(authenticated3 != true){
            return res.status(403).send('Invalid Username and Password')
        }
    if(Object.keys(req.body).length != 5){
        return res.status(400).send('Invalid Input')
    } 
    if(!validateSchema(req)){
        return res.status(400).send('Invalid Input Parameters')
    }
    patchProduct(req,res);
}
async function updateProductInfo(id,updateFields,res){
    try {
        await Product.update(updateFields,{where: {id: id}});
        //product updated 
        logger.info("update Product Success for ProductId: "+id)
        res.status(204).send('Product Updated Successfully')
      } catch (error) {
        console.log(error.message);
        return res.status(400).send(error.message)
      }
    
}

module.exports = {
    addProduct,
    getProduct,
    deleteProduct,
    updateProduct,
    patchProduct   
}
















