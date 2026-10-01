import { Category } from '../models/Category.js';
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
  const updates = {};
  if (name) updates.name = name;
  if (image) updates.image = image;

  const updated = await Category.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
  if (!updated) throw new NotFoundError('Category not found.');
  return updated;
}

export async function deleteCategory(id) {
  const deleted = await Category.findByIdAndDelete(id).lean();
  if (!deleted) throw new NotFoundError('Category not found.');
  return { message: 'Category deleted successfully.' };
}
