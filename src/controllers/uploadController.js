import { createPresignedUploadUrl } from '../integrations/s3/s3Client.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';

export async function getPresignedUrl(req, res, next) {
  try {
    const { filename, fileType, folder = 'general' } = req.body;
    if (!fileType) {
      throw new BadRequestError('fileType is required (e.g. image/jpeg, image/png)');
    }

    const data = await createPresignedUploadUrl({
      filename: filename || 'file',
      fileType,
      folder,
    });

    return sendSuccess(res, data, 'Presigned upload URL generated successfully.');
  } catch (error) {
    next(error);
  }
}
