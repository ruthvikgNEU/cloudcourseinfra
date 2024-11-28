const bcrypt = require('bcrypt')
const moment = require('moment')
const db = require('../models')

const Images = db.images
const User = db.users
const Products = db.products
const logger = require('../logger');
const SDC = require('node-statsd');
const sdc = new SDC({
    host: "localhost",
    port: "8125"
});
const {uploadFile, deleteFile} = require('../s3')

const uploadImage = async (req,res) => {
    sdc.increment('Upload_Image');
    //check if Auth block exist in request
    if(!req.get('Authorization')){
        logger.info("Upload Image UnAuthorised for Product: "+req.params+id)
        return res.status(401).send('Unauthorized')
    }
    console.log(req.params)
    if(isNaN(req.params.id) || !req.file){
        logger.info("Upload Image UnAuthorised for Product: "+req.params+id)
        return res.status(400).send('Bad request')
    }

    // check if user is authorized
    const authenticated = await authenticate(req,res)

    if(!isNaN(authenticated)){

        const extension = req.file.mimetype

        // check if request body has all the necessary information
        if( extension!= "image/jpeg" && extension != "image/png"){
            logger.info("Upload Image File Format Not Supported for Product: "+req.params.id)
            return res.status(400).send('File Format Not Supported')
        }

        const result = await uploadFile(req)

        var date = moment().tz("America/New_York").format('YYYY-MM-DDTHH:mm:ss.sss')

        // structuring JSON object with Info
        let newImage = {
            product_id: req.params.id,
            file_name: req.file.originalname,
            date_created: date,
            s3_bucket_path : result.key,
        }

        const image = await Images.create(newImage)
        logger.info("Upload Image Success for Product: "+req.params.id)
        return res.status(201).send(image)
    }
}

// method to be executed on GET method call
const getImage = async (req, res) => {
    sdc.increment('Get_Image')
    if(isNaN(req.params.id) || isNaN(req.params.image) ){
        return res.status(400).json('Bad request');
    }

    //check if auth block exist in request
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }

    //decode auth
    const authenticated = await authenticate(req,res)

    if(!isNaN(authenticated)){

        let image = await Images.findOne({where: { product_id: req.params.id,image_id: req.params.image }})

        //check if product exist
        if(image != null){
            logger.info("Get Image Success for Product: "+req.params.id)
            return res.status(200).send(image)
        }else{
            logger.info("Get Image Not Found for Product: "+req.params.id)
            return res.status(404).send("Image Not Found")
        }
    }
}

const getAllImages = async (req, res) => {
    sdc.increment('Get_All_Images')
    if(isNaN(req.params.id)){
        return res.status(400).json('Bad request');
    }
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }
    const authenticated = await authenticate(req,res)
    if(!isNaN(authenticated)){
        let images = await Images.findAll({where: { product_id: req.params.id }})
        if(images != null){
            return res.status(200).send(images)
        }else{
            return res.status(404).send("Not Found")
        }
    }
}

const deleteImage = async (req,res) => {
    sdc.increment('Delete_Image')
    if(isNaN(req.params.id) || isNaN(req.params.image) ){
        return res.status(400).json('Bad request');
    }

    //check if auth block exist in request
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }

    //decode auth
    const authenticated = await authenticate(req,res)

    if(!isNaN(authenticated)){

        // retrieve product data based on parameter id
        let image = await Images.findOne({where: { product_id: req.params.id,image_id: req.params.image }})

        //check if product exist and delete
        if(image != null){

            await deleteFile(image.s3_bucket_path)

            await Images.destroy({where: { image_id: req.params.image }})
            logger.info("/Delete Image Success for Product: "+req.params.id)
            return res.status(204).send()
        }else{
            logger.info("/Delete Image Failed for Product: "+req.params.id)
            return res.status(404).send("Image Not Found")
        }
    }

}

// function to authenticate a user
async function authenticate (req, res) {
    // decrypt auth
    var basicAuth = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
    let user = await User.findOne({where: { username: basicAuth[0] }})

    if(user){
        const authenticated = await bcrypt.compare(basicAuth[1], user.password)
        if(authenticated){

            if(req.params.id){
                let product = await Products.findOne({where: { id: req.params.id }})
                if(product != null){
                    if(product.owner_user_id == user.id){
                        return user.id
                    }else{
                        return res.status(403).send('Forbidden')
                    }
                }else{
                    return res.status(404).send('Product Not Found')
                }
            }else{
                return user.id;
            }

        }else{
            return res.status(401).send('Unauthorized')
        }

    }else{
        return res.status(401).send('Unauthorized')
    }
}

module.exports = {
    getImage,
    deleteImage,
    uploadImage,
    getAllImages
}
