import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('order')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  indexSymbol: string;

  @Column({ type: 'float', nullable: false })
  triggerLevel: number;

  @Column({ nullable: false })
  candleAction: string;

  @Column({ nullable: false })
  optionType: string;

  @Column({ nullable: false })
  tradeType: string;

  @Column({ type: 'float', nullable: false })
  strikePrie: number;

  @Column({ nullable: false })
  expiryDate: Date;

  @Column({ nullable: false })
  contractSymbol: string;

  @Column({ type: 'int', nullable: false })
  lot: number;

  @Column({ nullable: false })
  contractSecurity: string;

  @Column({ nullable: false })
  status: string;
}
