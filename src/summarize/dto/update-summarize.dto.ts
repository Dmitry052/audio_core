import { PartialType } from '@nestjs/mapped-types';
import { CreateSummarizeDto } from './create-summarize.dto';

export class UpdateSummarizeDto extends PartialType(CreateSummarizeDto) {}
