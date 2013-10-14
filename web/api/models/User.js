/**
 * User
 *
 * @module      :: Model
 * @description :: Represents a user of the system (logging in and accessing the application).
 */

var bcrypt = require('bcrypt');

module.exports = {

    adapter: 'salient-system',
    schema: true,

    attributes: {
        
        username: { type: 'string', required: true, unique: true },
        email: { type: 'email', required: true, unique: true },
        password: { type: 'string', required: true, minLength: 6, columnName: 'hash' },
        firstName: { type: 'string', required: true },
        lastName: { type: 'string', required: true },

        fullName: function () {
            return this.firstName + ' ' + this.lastName;
        },

        toJSON: function () {
            var obj = this.toObject();
            delete obj.password;
            return obj;
        }

    },

    /**
    * beforeCreate
    * @description :: Stores the encrypted hash of the new password value.
    */
    beforeCreate: function (values, next) {
        bcrypt.hash(values.password, 10, function (err, hash) {
            if (err) return next(err);
            values.password = hash;
            next();
        });
    },

    beforeUpdate: function (values, next) {
        if (values.password) {
            bcrypt.hash(values.password, 10, function (err, hash) {
                if (err) return next(err);
                values.password = hash;
                next();
            });
        }
        else {
            next();
        }
    }

};
