import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Intraday } from './entities/intraday.entity';
import { Order } from './entities/order.entity';
import { Security } from './entities/security.entity';
import { Stock } from './entities/stocks.entity';
import { TradeModule } from './trade/trade.module';
import { TradeService } from './trade/trade.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: process.env.POSTGRES_DB,
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      entities: [Stock, Intraday, Security, Order],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Stock, Intraday, Security, Order]),
    HttpModule,
    TradeModule,
  ],
  controllers: [AppController],
  providers: [AppService, TradeService],
})
export class AppModule {}
