import { Document, model, Types, Schema } from 'mongoose';
import { hashPassword } from '../../utils';

export interface IUser {
    fullName?: string;
    email: string;
    phone?: string;
    address?: Map<string, string>;
    username?: string;
    password: string;
    gender?: string;
    photo?: string;
    NIN: string;
}

interface UserDocument extends IUser, Document {
    address: Types.Map<string>;
    findOneOrCreate: any;
}

const userModel = new Schema<UserDocument>(
    {
        fullName: {
            type: String,
            required: true
        },
        username: {
            type: String,
            unique: false,
            lowercase: true,
            min: 3,
            max: 100,
            required: false,
            default: ''
        },
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            validate: {
                validator: function (v: any) {
                    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
                },
                message: 'Please enter a valid email'
            }
        },
        phone: {
            type: String,
            required: false
        },
        password: {
            type: String,
            required: true,
            min: 6,
            max: 225
        },
        address: {
            type: Map,
            of: String,
            required: false
        },
        gender: {
            type: String,
            required: true
        },

        photo: {
            type: String,
            required: false
        },
        NIN: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

userModel.statics.findOneOrCreate = function findOneOrCreate(condition, doc, callback) {
    const self = this;
    self.findOne(condition, (err: any, result: any) => {
        return result
            ? callback(err, result)
            : self.create(doc, (err: any, result: any) => {
                  return callback(err, result);
              });
    });
};

//* MIDDLEWARE *//
userModel.pre<UserDocument>('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await hashPassword(this.password); //import a hasPassword function
    }
});

const User = model('User', userModel);

export default User;
