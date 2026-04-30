import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SummarizeService } from './summarize.service';
import { CreateSummarizeDto } from './dto/create-summarize.dto';
import { UpdateSummarizeDto } from './dto/update-summarize.dto';
import { QuerySummarizeDto } from './dto/query-summarize.dto';

@Controller('summarize')
@UseGuards(JwtAuthGuard)
export class SummarizeController {
  constructor(private readonly summarizeService: SummarizeService) {}

  @Get()
  findAll(@Query() query: QuerySummarizeDto) {
    return this.summarizeService.findAll(query.skip ?? 0, query.take ?? 20);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.summarizeService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSummarizeDto) {
    return this.summarizeService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSummarizeDto,
  ) {
    return this.summarizeService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.summarizeService.remove(id);
  }
}
