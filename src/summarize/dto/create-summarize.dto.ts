import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSummarizeDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  transcribe: string;

  @IsString()
  @IsNotEmpty()
  summarize: string;
}
