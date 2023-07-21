import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Intraday } from 'src/entities/intraday.entity';
import { Order } from 'src/entities/order.entity';
import { Security } from 'src/entities/security.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TradeService {
  constructor(
    @InjectRepository(Intraday)
    private readonly intradayRepo: Repository<Intraday>,
    @InjectRepository(Security)
    private readonly securityRepo: Repository<Security>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}
  async createNewOrder(
    indexSymbol: string,
    triggerLevel: number,
    candleAction: string,
    optionType: string,
    tradeType: string,
    strikePrie: number,
    expiryDate: Date,
    lot: number,
  ) {
    const usableExpiryDate = new Date(expiryDate);
    const customContractSymbol = `${indexSymbol.toUpperCase()} ${usableExpiryDate.getDate()} ${usableExpiryDate
      .toLocaleString('default', { month: 'short' })
      .toUpperCase()} ${strikePrie} ${optionType}`;
    const securityDetail = await this.securityRepo.findOne({
      where: {
        customSymbol: customContractSymbol,
      },
    });
    if (securityDetail) {
      const order = new Order();
      order.indexSymbol = indexSymbol;
      order.triggerLevel = triggerLevel;
      order.candleAction = candleAction;
      order.optionType = optionType;
      order.tradeType = tradeType;
      order.strikePrie = strikePrie;
      order.expiryDate = securityDetail.expiryDate;
      order.contractSymbol = securityDetail.symbol;
      order.lot = lot;
      order.contractSecurity = securityDetail.securityID;
      order.status = 'pending';
      this.orderRepo.save(order);
      return order;
    } else {
      return 'Wrong Order Inputs.';
    }
  }
  async getOrders(type: 'pending' | 'success' | 'cancelled') {
    const orders = await this.orderRepo.find({
      where: { status: type },
    });
    return orders;
  }
}
