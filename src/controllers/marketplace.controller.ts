import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateMarketplaceOrderDto, CreateProductDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { ExperienceDatabaseService } from '../services/experience-database.service';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly experienceDatabase: ExperienceDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  async getMarketplaceOverview() {
    const payload = await this.experienceDatabase.getMarketplaceOverview();
    return {
      success: true,
      message: 'Marketplace fetched successfully.',
      ...payload,
      data: payload,
      result: payload,
    };
  }

  @Get('create')
  getMarketplaceCreateOptions() {
    return this.experienceDatabase.getMarketplaceCreateOptions();
  }

  @Get('detail')
  getMarketplaceDetail(@Query('id') id: string) {
    return this.getMarketplaceDetailById(id);
  }

  @Get('detail/:id')
  getMarketplaceDetailById(@Param('id') id: string) {
    return this.experienceDatabase.getMarketplaceDetail(id);
  }

  @Get('checkout')
  async getMarketplaceCheckout(@Query('id') id: string) {
    const product = await this.experienceDatabase.getMarketplaceProduct(id);
    return {
      product,
      checkoutDefaults: {
        address: 'House 14, Road 7, Dhanmondi, Dhaka',
        deliveryMethod: 'Home delivery',
        paymentMethod: 'Cash on delivery',
      },
      deliveryMethods: ['Home delivery', 'Pickup arranged', 'Courier shipping'],
      paymentMethods: ['Cash on delivery', 'Wallet', 'Card'],
      recentOrders: [],
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('checkout')
  async createMarketplaceOrder(
    @Body() body: CreateMarketplaceOrderDto,
    @Headers('authorization') authorization?: string,
  ) {
    const buyer = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.buyerId,
    );
    return this.experienceDatabase.createMarketplaceOrder(buyer.id, body);
  }

  @Get('products')
  async getProducts() {
    const payload = await this.experienceDatabase.getMarketplaceOverview();
    return payload.products;
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.experienceDatabase.getMarketplaceProduct(id);
  }

  @Post('create')
  createProductAlias(@Body() body: CreateProductDto) {
    return this.createProduct(body);
  }

  @UseGuards(SessionAuthGuard)
  @Post('products')
  async createProduct(
    @Body() body: CreateProductDto,
    @Headers('authorization') authorization?: string,
  ) {
    const seller = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.sellerId,
    );
    return this.experienceDatabase.createMarketplaceProduct({
      ...body,
      sellerId: seller.id,
    });
  }
}
