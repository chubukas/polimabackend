import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DBCluster: string =
    process.env.DATABASE ||
    'mongodb+srv://chubukas:<PASSWORD>@cluster0.2sqst.mongodb.net/polima?retryWrites=true&w=majority';
const DBLocal: string = process.env.DATABASE_LOCAL || 'mongodb://localhost:27017/polima';
const DBPassword: string = process.env.DATABASE_PASSWORD || 'student55';

let DB_URL = '';

if (process.env.NODE_ENV === 'development') {
    DB_URL = DBLocal;
} else if (process.env.NODE_ENV === 'production') {
    DB_URL = DBCluster?.replace('<PASSWORD>', DBPassword);
}

const connection = mongoose
    .connect(DB_URL, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        console.log(`DB::connected`);
    })
    .catch((e) => {
        console.log(`DB::disconnected`);
    });
export default connection;
