import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class AnswerTimeline {
  @Prop({ type: String, required: true })
  answer: string;

  @Prop({ type: Number, required: true })
  timestamp: number;

  @Prop({ type: Number })
  duration?: number;
}

export class UserAnswer {
  @Prop({ type: Number, required: true })
  questionNumber: number;

  @Prop({ type: String, required: true })
  selectedAnswer: string;

  @Prop({ type: Boolean, required: true })
  isCorrect: boolean;

  @Prop({ type: String, required: true })
  correctAnswer: string;

  @Prop({ type: [AnswerTimeline] })
  answerTimeline?: AnswerTimeline[];

  @Prop({ type: Number })
  timeToFirstAnswer?: number;

  @Prop({ type: Number })
  totalTimeSpent?: number;

  @Prop({ type: Number, default: 0 })
  answerChanges?: number;
}

export class PartMetrics {
  @Prop({ type: String, required: true })
  partName: string;

  @Prop({ type: Number, required: true })
  questionsCount: number;

  @Prop({ type: Number, required: true })
  totalTime: number;

  @Prop({ type: Number, required: true })
  averageTimePerQuestion: number;

  @Prop({ type: Number, required: true })
  answerChangeRate: number;

  @Prop({ type: [Number], default: [] })
  slowestQuestions: number[];
}

export class OverallMetrics {
  @Prop({ type: Number, required: true })
  totalActiveTime: number;

  @Prop({ type: Number, required: true })
  averageTimePerQuestion: number;

  @Prop({ type: Number, required: true })
  totalAnswerChanges: number;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  confidenceScore: number;

  @Prop({ type: Map, of: Number })
  timeDistribution?: Map<string, number>;
}

export class HesitationQuestion {
  @Prop({ type: Number, required: true })
  questionNumber: number;

  @Prop({ type: Number, required: true })
  answerChanges: number;

  @Prop({ type: Number, required: true })
  timeToFirstAnswer: number;

  @Prop({ type: Number, required: true })
  totalTimeSpent: number;

  @Prop({ type: String, required: true })
  finalAnswer: string;

  @Prop({ type: Boolean, required: true })
  isCorrect: boolean;

  @Prop({ type: [String], required: true })
  changeHistory: string[];
}

export class HesitationAnalysis {
  @Prop({ type: [HesitationQuestion], required: true })
  topHesitationQuestions: HesitationQuestion[];

  @Prop({ type: Number, required: true })
  averageChangesPerQuestion: number;

  @Prop({ type: Number, required: true })
  questionsWithMultipleChanges: number;
}

export class AnswerChangePatterns {
  @Prop({ type: Number, required: true })
  correctToIncorrect: number;

  @Prop({ type: Number, required: true })
  incorrectToCorrect: number;

  @Prop({ type: Number, required: true })
  incorrectToIncorrect: number;
}

export class SkillPerformance {
  @Prop({ type: String, required: true })
  skillName: string;

  @Prop({ type: String, required: true })
  skillKey: string;

  @Prop({ type: Number, required: true })
  total: number;

  @Prop({ type: Number, required: true })
  correct: number;

  @Prop({ type: Number, required: true })
  incorrect: number;

  @Prop({ type: Number, required: true })
  accuracy: number;

  @Prop({ type: Number })
  avgTime?: number;
}

export class PartAnalysis {
  @Prop({ type: String, required: true })
  partNumber: string;

  @Prop({ type: Number, required: true })
  totalQuestions: number;

  @Prop({ type: Number, required: true })
  correctAnswers: number;

  @Prop({ type: Number, required: true })
  accuracy: number;

  @Prop({ type: Number })
  avgTimePerQuestion?: number;

  @Prop({ type: [SkillPerformance] })
  skillBreakdown: SkillPerformance[];

  @Prop({ type: String })
  contextualAnalysis?: string;
}

export class WeaknessInsight {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  severity: string;

  @Prop({ type: String, required: true })
  skillKey: string;

  @Prop({ type: String, required: true })
  skillName: string;

  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: [String] })
  affectedParts: string[];

  @Prop({ type: Number, required: true })
  userAccuracy: number;

  @Prop({ type: Number, required: true })
  benchmarkAccuracy: number;

  @Prop({ type: Number, required: true })
  impactScore: number;

  @Prop({ type: Number, required: true })
  incorrectCount: number;

  @Prop({ type: Number, required: true })
  totalCount: number;
}

export class DomainPerformance {
  @Prop({ type: String, required: true })
  domain: string;

  @Prop({ type: Number, required: true })
  totalQuestions: number;

  @Prop({ type: Number, required: true })
  correctAnswers: number;

  @Prop({ type: Number, required: true })
  accuracy: number;

  @Prop({ type: Boolean, required: true })
  isWeak: boolean;
}

export class TimeAnalysis {
  @Prop({ type: [PartMetrics] })
  partMetrics?: PartMetrics[];

  @Prop({ type: OverallMetrics })
  overallMetrics?: OverallMetrics;

  @Prop({ type: HesitationAnalysis })
  hesitationAnalysis?: HesitationAnalysis;

  @Prop({ type: AnswerChangePatterns })
  answerChangePatterns?: AnswerChangePatterns;
}

export class ExamAnalysis {
  @Prop({ type: Map, of: Number })
  overallSkills?: Map<string, number>;

  @Prop({ type: [PartAnalysis] })
  partAnalyses?: PartAnalysis[];

  @Prop({ type: [String] })
  strengths?: string[];

  @Prop({ type: String, required: true })
  summary: string;

  @Prop({ type: [WeaknessInsight], required: true })
  topWeaknesses: WeaknessInsight[];

  @Prop({ type: [DomainPerformance], required: true })
  domainPerformance: DomainPerformance[];

  @Prop({ type: [String], required: true })
  weakDomains: string[];

  @Prop({ type: [String], required: true })
  keyInsights: string[];

  @Prop({ type: Date, required: true, default: Date.now })
  generatedAt: Date;
}

export class Analysis {
  @Prop({ type: TimeAnalysis })
  timeAnalysis?: TimeAnalysis;

  @Prop({ type: ExamAnalysis })
  examAnalysis?: ExamAnalysis;
}

export type TestResultDocument = TestResult & Document;

@Schema({
  collection: 'test_results',
  timestamps: true,
})
export class TestResult {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  testId: Types.ObjectId;

  @Prop({ type: String, required: true })
  testTitle: string;

  @Prop({
    type: String,
    required: true,
    enum: ['listening-reading', 'speaking', 'writing'],
  })
  testType: string;

  @Prop({ type: Number, required: true })
  duration: number;

  @Prop({ type: Date, required: true, default: Date.now })
  completedAt: Date;

  @Prop({ type: Number, required: true })
  score: number;

  @Prop({ type: Number, required: true })
  listeningScore: number;

  @Prop({ type: Number, required: true })
  readingScore: number;

  @Prop({ type: Number, required: true })
  totalScore: number;

  @Prop({ type: Number, required: true })
  totalQuestions: number;

  @Prop({ type: [UserAnswer] })
  userAnswers: UserAnswer[];

  @Prop({ type: [String], required: true })
  parts: string[];

  @Prop({ type: String })
  partsKey?: string;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Analysis })
  analysis?: Analysis;
}

export const testResultSchema = SchemaFactory.createForClass(TestResult);