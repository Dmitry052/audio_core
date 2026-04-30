import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSummarizeDto } from './dto/create-summarize.dto';
import { UpdateSummarizeDto } from './dto/update-summarize.dto';

function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2025'
  );
}

@Injectable()
export class SummarizeService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(skip = 0, take = 20) {
    return this.prisma.summarize.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
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
    try {
      return await this.prisma.summarize.update({ where: { id }, data: dto });
    } catch (err) {
      if (isNotFound(err)) throw new NotFoundException(`Summarize #${id} not found`);
      throw err;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.summarize.delete({ where: { id } });
    } catch (err) {
      if (isNotFound(err)) throw new NotFoundException(`Summarize #${id} not found`);
      throw err;
    }
  }
}
