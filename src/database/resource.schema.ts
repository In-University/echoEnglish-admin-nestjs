import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ResourceType } from '../common/enums/resource-type.enum';
import { Domain } from '../common/enums/domain.enum';

export type ResourceDocument = Resource & Document;

@Schema({
  collection: 'resources',
  timestamps: true,
})
export class Resource {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ResourceType),
    required: [true, 'TYPE_REQUIRED'],
  })
  type: ResourceType;

  @Prop({
    required: [true, 'URL_REQUIRED'],
  })
  url: string;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ type: String, default: 'en' })
  lang: string;

  @Prop({ type: String })
  summary?: string;

  @Prop({ type: String })
  content?: string;

  @Prop({ type: [String], default: [] })
  keyPoints: string[];

  @Prop({
    type: {
      cefr: { type: String },
      style: { type: String },
      domain: {
        type: String,
        enum: Object.values(Domain),
      },
      topic: { type: [String], default: [] },
      genre: { type: String },
      setting: { type: String },
      speechActs: { type: [String], default: [] },
    },
    _id: false,
  })
  labels?: {
    cefr?: string;
    style?: string;
    domain?: Domain;
    topic?: string[];
    genre?: string;
    setting?: string;
    speechActs?: string[];
  };

  @Prop({
    type: Boolean,
    required: [true, 'SUITABLE_FOR_LEARNERS_REQUIRED'],
  })
  suitableForLearners: boolean;

  @Prop({ type: String })
  moderationNotes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
