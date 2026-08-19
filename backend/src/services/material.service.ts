import { Types } from 'mongoose';
import { Material, IMaterial, MaterialType } from '../models/Material.js';
import { Subject } from '../models/Subject.js';
import { emitToSubject } from '../config/socket.js';

export class MaterialService {
  static async createMaterial(
    uploadedById: string,
    data: {
      classId: string;
      subjectId: string;
      title: string;
      description?: string;
      type: MaterialType;
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      tags?: string[];
    }
  ): Promise<IMaterial> {
    const material = await Material.create({
      ...data,
      uploadedBy: uploadedById,
      tags: data.tags || [],
    });

    const populated = await Material.findById(material._id).populate(
      'uploadedBy',
      'name email avatar'
    );

    emitToSubject(data.subjectId, 'material:created', populated);
    return populated || material;
  }

  static async getMaterials(
    subjectId: string,
    options: {
      type?: MaterialType;
      search?: string;
      tag?: string;
      sortBy?: 'latest' | 'oldest' | 'most_viewed' | 'title';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ materials: IMaterial[]; total: number; page: number; pages: number }> {
    const filter: any = { subjectId };

    if (options.type) {
      filter.type = options.type;
    }

    if (options.tag) {
      filter.tags = options.tag.toLowerCase().trim();
    }

    if (options.search) {
      const searchRegex = new RegExp(options.search, 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }];
    }

    let sort: any = { createdAt: -1 };
    if (options.sortBy === 'oldest') sort = { createdAt: 1 };
    else if (options.sortBy === 'most_viewed') sort = { viewCount: -1, createdAt: -1 };
    else if (options.sortBy === 'title') sort = { title: 1 };

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 20);
    const skip = (page - 1) * limit;

    const [materials, total] = await Promise.all([
      Material.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name email avatar'),
      Material.countDocuments(filter),
    ]);

    return {
      materials,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  static async incrementView(materialId: string): Promise<void> {
    await Material.findByIdAndUpdate(materialId, { $inc: { viewCount: 1 } });
  }

  static async deleteMaterial(materialId: string, userId: string, userRole: string): Promise<void> {
    const material = await Material.findById(materialId);
    if (!material) throw new Error('Material not found.');

    if (userRole !== 'ADMIN') {
      const subject = await Subject.findById(material.subjectId);
      const isPrimary = subject?.primaryFacultyId.toString() === userId;
      const isUploader = material.uploadedBy.toString() === userId;

      if (!isPrimary && !isUploader) {
        throw new Error('Not authorized to delete this material.');
      }
    }

    await Material.findByIdAndDelete(materialId);
  }
}
