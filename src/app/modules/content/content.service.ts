import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ContentModel, IContent } from './content.interface';
import { Content } from './content.model';
import { JwtPayload } from 'jsonwebtoken';

const addContent = async (payload: IContent) => {
  const isIntroExist = await Content.findOne({ type: 'intro' });

  if (isIntroExist) {
   const updated = await Content.findOneAndUpdate({ type: 'intro' }, payload, { new: true, upsert:true });
   return updated;
  }

  const content = await Content.create(payload);
  if (!content) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add content');
  return content;
};


const updateContent = async (id: string, payload: IContent): Promise<IContent> => {
  const content = await Content.findById(id);
  if(!content) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update content');
  if(content.mentor.toString() !== payload.mentor.toString()) throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to update this content');

  const updatedContent = await Content.findByIdAndUpdate(id, payload, { new: true });
  if(!updatedContent) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update content');
  return updatedContent;
};

const deleteContent = async (id: string, user: JwtPayload): Promise<IContent | null> => {
  const content = await Content.findById(id);
  if(!content) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete content');
  if(content.mentor.toString() !== user.id.toString()) throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to delete this content');
  
  const deletedContent = await Content.findByIdAndDelete(id);
  if(!deletedContent) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete content');
  return deletedContent;
};


const getAllContent = async (query:any) => {
    const {type} = query;
  const content = await Content.find({type:type || "intro"}).lean();
  return content.length === 1 && type === "intro" ? content[0] : content;
};

export const ContentServices = { addContent, updateContent, deleteContent, getAllContent };
