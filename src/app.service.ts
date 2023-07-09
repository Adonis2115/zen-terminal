import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Intraday } from './entities/intraday.entity';
import { Stock } from './entities/stocks.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Intraday)
    private readonly intradayRepo: Repository<Intraday>,
    private readonly httpService: HttpService,
  ) {}
  getHello(): string {
    return 'Pong';
  }
  async getAllStock() {
    return await this.stockRepo.find();
  }
}
