import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  content: { type: String, required: true, maxlength: 20000 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

noteSchema.index({ owner: 1, updatedAt: -1 });
noteSchema.index({ updatedAt: -1 });

export default mongoose.model('Note', noteSchema);
