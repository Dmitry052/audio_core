import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSummarizeDto } from './dto/create-summarize.dto';
import { UpdateSummarizeDto } from './dto/update-summarize.dto';

@Injectable()
export class SummarizeService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.summarize.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    const record = await this.prisma.summarize.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Summarize #${id} not found`);
    return record;
  }

  create(dto: CreateSummarizeDto) {
    return this.prisma.summarize.create({ data: dto });
  }

  async update(id: number, dto: UpdateSummarizeDto) {
    await this.findOne(id);
    return this.prisma.summarize.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.summarize.delete({ where: { id } });
  }
}
