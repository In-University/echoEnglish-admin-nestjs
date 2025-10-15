import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourceService } from './resource.service';
import { ResourceController } from './resource.controller';
import { Resource, ResourceSchema } from '../../database/resource.schema';
import { GoogleGenAIService } from '../../common/services/google-genai.service';
import { PromptManagerService } from '../../common/services/prompt-manager.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
    ]),
  ],
  providers: [ResourceService, GoogleGenAIService, PromptManagerService],
  controllers: [ResourceController],
  exports: [ResourceService],
})
export class ResourceModule {}
