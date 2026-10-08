import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export async function getAllCategories(search = '') {
  const query = {};
  if (search) query.name = { $regex: search, $options: 'i' };
  return Category.find(query).sort({ name: 1 }).lean();
}

export async function getCategoryById(id) {
  const category = await Category.findById(id).lean();
  if (!category) throw new NotFoundError('Category not found.');
  return category;
}

export async function createCategory({ name, image }) {
  const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (existing) throw new ConflictError('A category with this name already exists.');

  const category = await Category.create({ name, image });
  return category;
}

export async function updateCategory(id, { name, image }) {
  const category = await Category.findById(id);
  if (!category) throw new NotFoundError('Category not found.');

  const oldName = category.name;
  if (name && name.trim().toLowerCase() !== oldName.toLowerCase()) {
    const existing = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) throw new ConflictError('A category with this name already exists.');
    category.name = name.trim();
  } else if (name) {
    category.name = name.trim();
  }

  if (image !== undefined && image !== null) {
    category.image = image;
  }

  await category.save();

  if (oldName !== category.name) {
    await Product.updateMany({ category: oldName }, { $set: { category: category.name } });
  }

  return category.toObject();
}

export async function deleteCategory(id) {
  const deleted = await Category.findByIdAndDelete(id).lean();
  if (!deleted) throw new NotFoundError('Category not found.');
  return { message: 'Category deleted successfully.' };
}
