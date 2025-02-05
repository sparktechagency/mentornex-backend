import { StatusCodes } from 'http-status-codes'
import { IRule } from './rule.interface'
import { Rule } from './rule.model'
import ApiError from '../../../errors/ApiError'

//privacy policy
const createPrivacyPolicyToDB = async (payload: IRule) => {

    // check if privacy policy exist or not
    const isExistPrivacy = await Rule.findOne({ type: 'privacy' })

    if (isExistPrivacy) {

        // update privacy is exist 
        const result = await Rule.findOneAndUpdate({type: 'privacy'}, {content: payload?.content}, {new: true})
        const message = "Privacy & Policy Updated successfully"
        return { message, result }
    } else {

        // create new if not exist
        const result = await Rule.create({ ...payload, type: 'privacy' })
        const message = "Privacy & Policy Created successfully"
        return {message, result}
    }
}

const getPrivacyPolicyFromDB = async () => {
    const result = await Rule.findOne({ type: 'privacy' }).select("content");
    if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Privacy policy doesn't exist!")
    }
    return result
}

//terms and conditions
const createTermsAndConditionToDB = async (payload: IRule) => {

    const isExistTerms = await Rule.findOne({ type: 'terms' })
    if (isExistTerms) {
        const result = await Rule.findOneAndUpdate({type: 'terms'}, {content: payload?.content}, {new: true})
        const message = "Terms And Condition Updated successfully"
        return { message, result }
  
    } else {
        const result = await Rule.create({ ...payload, type: 'terms' });
        const message = "Terms And Condition Created Successfully"
        return { message, result }
    }
}

const getTermsAndConditionFromDB = async () => {
    const result = await Rule.findOne({ type: 'terms' }).select("content");
    if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Terms and conditions doesn't  exist!")
    }
    return result
}


  
export const RuleService = {
    createPrivacyPolicyToDB,
    getPrivacyPolicyFromDB,
    createTermsAndConditionToDB,
    getTermsAndConditionFromDB
}  