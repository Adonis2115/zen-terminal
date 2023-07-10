import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Intraday } from 'src/entities/intraday.entity';
import { Order } from 'src/entities/order.entity';
import { Security } from 'src/entities/security.entity';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';

@Module({
  imports: [TypeOrmModule.forFeature([Intraday, Security, Order])],
  controllers: [TradeController],
  providers: [TradeService],
})
export class TradeModule {}
