import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resource, ResourceDocument } from '../../database/resource.schema';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceType } from '../../common/enums/resource-type.enum';
import { Domain, AVAILABLE_DOMAINS } from '../../common/enums/domain.enum';
import { GoogleGenAIService } from '../../common/services/google-genai.service';
import { PromptManagerService } from '../../common/services/prompt-manager.service';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { YoutubeTranscript } from '@danielxceron/youtube-transcript';
import Parser from 'rss-parser';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import pLimit from 'p-limit';
import omit from 'lodash/omit';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
  end: number;
}

@Injectable()
export class ResourceService {
  private readonly rssFeeds: readonly string[] = [
    'https://e.vnexpress.net/rss/travel.rss',
    'https://e.vnexpress.net/rss/world.rss',
    // 'https://tuoitrenews.vn/rss',
  ];

  constructor(
    @InjectModel(Resource.name)
    private resourceModel: Model<ResourceDocument>,
    private googleGenAIService: GoogleGenAIService,
    private promptManagerService: PromptManagerService,
  ) {}

  async updateResource(
    id: string,
    updateData: UpdateResourceDto,
  ): Promise<Resource> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid resource ID');
    }

    const resource = await this.resourceModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async deleteResource(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid resource ID');
    }

    const result = await this.resourceModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Resource not found');
    }
  }

  private cleanHtmlContent(html: string): string {
    if (!html) return '';
    const cleaned = html.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1').trim();
    return cleaned;
  }

  private async fetchArticleText(url: string): Promise<string> {
    try {
      const { data } = await axios.get(url, {
        timeout: 10000,
        responseType: 'text',
      });
      const html = typeof data === 'string' ? data : String(data);
      const dom = new JSDOM(html, { url });

      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      return article?.content || '';
    } catch (err) {
      console.error(`[fetchArticleText] Error: ${url}`, err);
      return '';
    }
  }

  private async analyzeContentWithLLM(content: string) {
    const templateString =
      await this.promptManagerService.getTemplate('resource_analysis');

    const formattedPrompt = await PromptTemplate.fromTemplate(
      templateString,
    ).format({
      content,
    });

    const model = this.googleGenAIService.getModel();
    const parser = new JsonOutputParser();

    try {
      const chain = model.pipe(parser);
      return await chain.invoke(formattedPrompt);
    } catch (error) {
      console.error('[ResourceService] analyzeContentWithLLM failed', error);
      throw new Error(
        'AI model failed to analyze content or return valid JSON.',
      );
    }
  }

  private extractVideoId(url: string): string | null {
    if (!url) return null;

    const regex =
      /(?:youtube\.com\/(?:.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async searchResource(
    filters: Record<string, string>,
    page: number,
    limit: number,
    sortOption: Record<string, 1 | -1>,
  ): Promise<{
    data: Resource[];
    total: number;
    totalPages: number;
    page: number;
  }> {
    const query: any = {};

    // Áp dụng các filter
    if (filters.type) {
      query.type = filters.type;
    }

    if (
      filters.suitableForLearners &&
      filters.suitableForLearners.trim() !== ''
    ) {
      if (filters.suitableForLearners === 'true') {
        query.suitableForLearners = true;
      } else {
        query.suitableForLearners = false;
      }
    }

    if (filters.q && filters.q.trim() !== '') {
      query.title = new RegExp(filters.q, 'i');
    }

    if (filters.style) {
      query['labels.style'] = filters.style;
    }

    if (filters.domain) {
      query['labels.domain'] = filters.domain;
    }

    if (filters.topic) {
      query['labels.topic'] = { $in: [filters.topic] };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.resourceModel
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.resourceModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  }

  async getTranscript(url: string): Promise<TranscriptSegment[]> {
    if (!url) {
      throw new NotFoundException('YouTube URL is required');
    }

    const vid = this.extractVideoId(url);
    if (!vid) {
      throw new NotFoundException('Invalid YouTube URL or video ID');
    }

    const transcriptItems = await YoutubeTranscript.fetchTranscript(vid, {
      lang: 'en',
    });

    return transcriptItems.map((r: any) => ({
      text: r.text,
      start: r.offset,
      duration: r.duration,
      end: r.duration + r.offset,
    }));
  }

  async saveTranscript(url: string): Promise<Resource> {
    const vid = this.extractVideoId(url);
    if (!vid) {
      throw new NotFoundException('Invalid YouTube URL or video ID');
    }

    const embedUrl = `https://www.youtube.com/embed/${vid}`;

    // Check if already exists
    const existing = await this.resourceModel.findOne({
      url: embedUrl,
      type: ResourceType.YOUTUBE,
    });

    if (existing) {
      throw new Error('Resource already exists');
    }

    const transcript = await this.getTranscript(url);
    const fullContent = transcript.map((t) => t.text).join(' ');

    // Analyze with AI
    const analyzed = await this.analyzeContentWithLLM(fullContent);

    const payload: Partial<Resource> = {
      type: ResourceType.YOUTUBE,
      url: embedUrl,
      title: analyzed.title || 'Youtube Resource',
      publishedAt: new Date(),
      lang: 'en',
      summary: analyzed.summary,
      content: fullContent,
      keyPoints: analyzed.keyPoints,
      labels: analyzed.labels,
      suitableForLearners: analyzed.suitableForLearners,
      moderationNotes: analyzed.moderationNotes,
    };

    const resource = await this.resourceModel.create(payload);
    return resource;
  }

  async triggerRss(): Promise<Resource[]> {
    const results: Resource[] = [];
    const limit = pLimit(5);

    try {
      for (const feedUrl of this.rssFeeds) {
        console.log(`[RSS] Fetching feed: ${feedUrl}`);
        const parser = new Parser();
        const feed = await parser.parseURL(feedUrl);

        let validCount = 0;
        const itemPromises: Promise<Resource | null>[] = [];

        for (const item of feed.items) {
          if (validCount >= 1) break; // 1 Bài báo mỗi RSS feed

          const exist = await this.resourceModel.findOne({ url: item.link });
          if (exist) {
            console.log(`[RSS] Skip duplicated: ${item.link}`);
            continue;
          }

          validCount++;
          itemPromises.push(
            limit(async () => {
              try {
                const htmlContent = item.link
                  ? await this.fetchArticleText(item.link)
                  : '';

                const analyzed = await this.analyzeContentWithLLM(
                  item.title + '\n' + htmlContent,
                );

                // Validate domain - fallback to GENERAL if not in enum
                if (
                  analyzed.labels?.domain &&
                  !AVAILABLE_DOMAINS.includes(analyzed.labels.domain as Domain)
                ) {
                  console.warn(
                    `[RSS] Invalid domain "${analyzed.labels.domain}" for ${item.link}, fallback to GENERAL`,
                  );
                  analyzed.labels.domain = Domain.GENERAL;
                } else if (!analyzed.labels?.domain) {
                  analyzed.labels = {
                    ...analyzed.labels,
                    domain: Domain.GENERAL,
                  };
                }

                const payload: Partial<Resource> = {
                  type: ResourceType.WEB_RSS,
                  url: item.link || '',
                  title: item.title || 'Untitled',
                  publishedAt: item.pubDate
                    ? new Date(item.pubDate)
                    : new Date(),
                  lang: 'en',
                  summary: analyzed.summary,
                  content: this.cleanHtmlContent(htmlContent),
                  keyPoints: analyzed.keyPoints,
                  labels: analyzed.labels,
                  suitableForLearners: analyzed.suitableForLearners,
                  moderationNotes: analyzed.moderationNotes,
                };

                const resource = await this.resourceModel.create(payload);
                console.log(`[RSS] Saved: ${item.link}`);
                return resource;
              } catch (err) {
                console.error(
                  `[ResourceService] Failed to process ${item.link}:`,
                  err.message,
                );
                return null;
              }
            }),
          );
        }

        const feedResults = await Promise.all(itemPromises);
        results.push(...feedResults.filter((r): r is Resource => r !== null));
      }

      console.log(`[RSS] Total saved: ${results.length}`);
      return results;
    } catch (error) {
      console.error('[RSS] triggerRss failed:', error);
      throw error;
    }
  }
}
