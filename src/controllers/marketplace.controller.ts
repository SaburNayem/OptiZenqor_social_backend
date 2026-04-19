import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get('products')
  getProducts() {
    return this.platformData.getProducts();
  }

  @Post('products')
  createProduct(
    @Body()
    body: {
      title: string;
      description: string;
      price: number;
      category: string;
      subcategory: string;
      sellerId: string;
      sellerName: string;
      location: string;
      images?: string[];
      condition: string;
    },
  ) {
    return this.platformData.createProduct({
      title: body.title,
      description: body.description,
      price: body.price,
      category: body.category,
      subcategory: body.subcategory,
      sellerId: body.sellerId,
      sellerName: body.sellerName,
      location: body.location,
      images: body.images ?? [],
      condition: body.condition,
    });
  }
}
