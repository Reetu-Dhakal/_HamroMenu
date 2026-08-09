import { Schema, model } from 'mongoose';

const RecommendationCacheSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true },
    similarity: { type: Schema.Types.Mixed, default: {} },
    coOccurrence: { type: Schema.Types.Mixed, default: {} },
    itemCount: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },
    stats: {
      users: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      reviews: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default model('RecommendationCache', RecommendationCacheSchema);