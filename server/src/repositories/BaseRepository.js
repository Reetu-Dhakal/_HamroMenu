class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne(filter, projection = {}) {
    return this.model.findOne(filter, projection);
  }

  async findById(id, projection = {}) {
    return this.model.findById(id, projection);
  }

  async find(filter = {}, options = {}) {
    let query = this.model.find(filter);
    if (options.projection) query = query.select(options.projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.lean) query = query.lean();
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    if (options.populate) query = query.populate(options.populate);
    return query.exec();
  }

  async paginate(filter = {}, { page = 1, limit = 20, sort = { createdAt: -1 }, projection, populate } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    let query = this.model.find(filter);
    if (projection) query = query.select(projection);
    if (sort) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limitNum) query = query.limit(limitNum);
    if (populate) query = query.populate(populate);

    const [docs, total] = await Promise.all([query.exec(), this.model.countDocuments(filter)]);
    return {
      docs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      hasNextPage: pageNum * limitNum < total,
      hasPrevPage: pageNum > 1,
    };
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async create(data) {
    return this.model.create(data);
  }

  async insertMany(data) {
    return this.model.insertMany(data);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true, ...options });
  }

  async updateOne(filter, update, options = {}) {
    return this.model.updateOne(filter, update, { runValidators: true, ...options });
  }

  async updateMany(filter, update, options = {}) {
    return this.model.updateMany(filter, update, { runValidators: true, ...options });
  }

  async deleteOne(filter) {
    return this.model.deleteOne(filter);
  }

  async findByIdAndDelete(id) {
    return this.model.findByIdAndDelete(id);
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }

  async distinct(field, filter = {}) {
    return this.model.distinct(field, filter);
  }
}

export default BaseRepository;