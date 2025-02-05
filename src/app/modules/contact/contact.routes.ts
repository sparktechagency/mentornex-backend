import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { ContactController } from "./contact.controller";
import validateRequest from "../../middlewares/validateRequest";
import { ContactValidation } from "./contact.validation";
const router = express.Router()

router
    .route("/")
    .post(
        validateRequest(ContactValidation.createContactZodSchema), 
        ContactController.createContact
    )
    .get( ContactController.getContact)
    .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), ContactController.bulkContactDelete);
    
router
    .route("/:id")
    .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), ContactController.deleteContact)

export const ContactRoutes = router;