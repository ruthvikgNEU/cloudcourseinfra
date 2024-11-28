const request = require('supertest')
const app = require('./app')
const chai = require('chai')
const expect = chai.expect

describe('Authentication Tests', function() {
    describe('Successes', function() {
        it('Return the product if the product name is valid', function(done) {
            request(app).post('/v1/product').send({ name:'test@gmail.com'}).end(function(err, res) {
                expect(res.statusCode).to.be.equal(401)
                done()
            })
        })
    })
})
