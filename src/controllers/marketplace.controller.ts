import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { CreateProductDto } from '../dto/api.dto';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly extendedData: ExtendedDataService,
  ) {}

  @Get()
  getMarketplaceOverview() {
    const products = this.platformData.getProducts();
    const masterData = this.extendedData.getMasterData();
    return {
      totalProducts: products.length,
      categories: masterData.marketplaceCategories,
      featuredProducts: products.slice(0, 5),
    };
  }

  @Get('products')
  getProducts() {
    return this.platformData.getProducts();
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.platformData.getProduct(id);
  }

  @Post('products')
  createProduct(@Body() body: CreateProductDto) {
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
