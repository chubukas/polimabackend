import { defaultFilterOptions, IFilters, sortBy } from './constant';
import corsOptions from './corsPermissions';
import { createConfirmationUrl } from './createConfirmationUrl';
import { sendEmail } from './sendMail';
import { multipleUpload, singleUpload } from './fileUpload';
import { base64FileUpload } from './fileValidation';
import { emailNotify } from './emailNotification';
import logger from './errorExecptionLogger';
import errorRequest from './errorRequest';
import {
    getCreator,
    getAdminFromDatabase,
    getUserFromDatabase,
    getUserFromToken
} from './findUser';
import { generateRef } from './generateRef';
import { hashPassword, validatePassword } from './hashPassword';
import { parsedOptions, priceRange, skipNumber, sortByFormatter, validateEmail } from './helper';
import {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} from './jwtValidation';
import { adminExist, userExist, usernameExist } from './userExist';

export {
    sortBy,
    sortByFormatter,
    emailNotify,
    errorRequest,
    logger,
    corsOptions,
    hashPassword,
    validatePassword,
    userExist,
    adminExist,
    getAdminFromDatabase,
    getUserFromDatabase,
    getUserFromToken,
    createConfirmationUrl,
    sendEmail,
    multipleUpload,
    singleUpload,
    base64FileUpload,
    getCreator,
    generateRef,
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    defaultFilterOptions,
    IFilters,
    skipNumber,
    priceRange,
    parsedOptions,
    usernameExist,
    validateEmail
};
