import * as categoryService from '../services/categoryService.js';
import { sendSuccess } from '../utils/response.js';

export async function getAll(req, res, next) {
  try {
    const { search = '' } = req.query;
    const categories = await categoryService.getAllCategories(search);
    return sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return sendSuccess(res, category);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const category = await categoryService.createCategory(req.body);
    return sendSuccess(res, category, 'Category created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const updated = await categoryService.updateCategory(req.params.id, req.body);
    return sendSuccess(res, updated, 'Category updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
