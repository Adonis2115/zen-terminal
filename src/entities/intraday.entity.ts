import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Stock } from './stocks.entity';

@Entity('intraday')
export class Intraday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float', nullable: false })
  open: number;

  @Column({ type: 'float', nullable: false })
  high: number;

  @Column({ type: 'float', nullable: false })
  low: number;

  @Column({ type: 'float', nullable: false })
  close: number;

  @Column({ nullable: false })
  volume: number;

  @Column({ nullable: false })
  time: Date;

  @ManyToOne(() => Stock, (stock) => stock.data)
  stockId: number;
}
