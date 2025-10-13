import { Module } from "@nestjs/common";
import { PromoController } from "./promo.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { PromoCode, promoCodeSchema } from "../../database/promo.schema";
import { PromoService } from "./promo.service";

@Module({
    imports: [MongooseModule.forFeature([{ name: PromoCode.name, schema: promoCodeSchema }])],
    controllers: [PromoController],
    providers: [PromoService],
})

export class PromoModule {}