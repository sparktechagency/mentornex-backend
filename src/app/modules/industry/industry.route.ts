import express, { NextFunction, Request, Response } from 'express';
import { IndustryController } from './industry.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { IndustryValidations } from './industry.validation';

const router = express.Router();

router.post('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),fileUploadHandler(), (req:Request, res:Response, next:NextFunction) =>{
    if(req?.body?.data) {
        req.body = IndustryValidations.createIndustryZodSchema.parse(JSON.parse(req.body.data));
    }
    IndustryController.createIndustry(req, res, next);
} ); 

router.get('/:id', IndustryController.getSingleIndustry);

router.patch('/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),fileUploadHandler(), (req:Request, res:Response, next:NextFunction) =>{
    if(req?.body?.data) {
        req.body = IndustryValidations.updateIndustryZodSchema.parse(JSON.parse(req.body.data));
    }
    IndustryController.updateIndustry(req, res, next);
} );

router.delete('/:id', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), IndustryController.deleteIndustry );

router.get('/', IndustryController.getAllIndustries );

export const IndustryRoutes = router;
