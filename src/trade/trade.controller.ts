import { Body, Controller, Post } from '@nestjs/common';
import { PostNewOrderDto } from 'src/dto/tradeDto';
import { TradeService } from './trade.service';

@Controller('trade')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}
  @Post('/neworder')
  createNewOrder(@Body() postNewOrderDto: PostNewOrderDto) {
    return this.tradeService.createNewOrder(
      postNewOrderDto.indexSymbol,
      postNewOrderDto.triggerLevel,
      postNewOrderDto.candleAction,
      postNewOrderDto.optionType,
      postNewOrderDto.tradeType,
      postNewOrderDto.strikePrie,
      postNewOrderDto.expiryDate,
      postNewOrderDto.lot,
    );
  }
}
