import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Delete, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  CreateMarketplaceDraftDto,
  CreateMarketplaceMessageDto,
  CreateMarketplaceOfferDto,
  CreateMarketplaceOrderDto,
  CreateProductDto,
  MarketplaceProductsQueryDto,
  UpdateMarketplaceCompareDto,
  UpdateMarketplaceDraftDto,
  UpdateMarketplaceOfferDto,
  UpdateMarketplaceProductStatusDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { ExperienceDatabaseService } from '../services/experience-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly experienceDatabase: ExperienceDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  async getMarketplaceOverview(
    @Query() query: MarketplaceProductsQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const viewer = await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null);
    const payload = await this.experienceDatabase.getMarketplaceOverview(query, viewer?.id);
    return {
      ...successResponse('Marketplace fetched successfully.', payload, payload.pagination),
      items: payload.items,
      results: payload.results,
      products: payload.products,
      result: payload,
    };
  }

  @Get('create')
  async getMarketplaceCreateOptions() {
    return successResponse(
      'Marketplace creation options fetched successfully.',
      await this.experienceDatabase.getMarketplaceCreateOptions(),
    );
  }

  @Get('detail')
  async getMarketplaceDetail(
    @Query('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const viewer = await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null);
    return successResponse(
      'Marketplace detail fetched successfully.',
      await this.experienceDatabase.getMarketplaceDetail(id, viewer?.id),
    );
  }

  @Get('detail/:id')
  async getMarketplaceDetailById(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedViewerId =
      (await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null))?.id;
    return successResponse(
      'Marketplace detail fetched successfully.',
      await this.experienceDatabase.getMarketplaceDetail(id, resolvedViewerId),
    );
  }

  @Get('checkout')
  async getMarketplaceCheckout(@Query('id') id: string) {
    const product = await this.experienceDatabase.getMarketplaceProduct(id);
    return successResponse('Marketplace checkout state fetched successfully.', {
      product,
      checkoutDefaults: {
        address: 'House 14, Road 7, Dhanmondi, Dhaka',
        deliveryMethod: 'Home delivery',
        paymentMethod: 'Cash on delivery',
      },
      deliveryMethods: ['Home delivery', 'Pickup arranged', 'Courier shipping'],
      paymentMethods: ['Cash on delivery', 'Wallet', 'Card'],
      recentOrders: [],
    });
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
    return successResponse(
      'Marketplace order created successfully.',
      await this.experienceDatabase.createMarketplaceOrder(buyer.id, body),
    );
  }

  @Get('products')
  async getProducts(@Query() query: MarketplaceProductsQueryDto) {
    const payload = await this.experienceDatabase.getMarketplaceOverview(query);
    return {
      ...successResponse('Marketplace products fetched successfully.', payload, payload.pagination),
      items: payload.items,
      results: payload.results,
      products: payload.products,
    };
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return successResponse(
      'Marketplace product fetched successfully.',
      await this.experienceDatabase.getMarketplaceProduct(id),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('compare')
  async getMarketplaceCompare(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Marketplace compare state fetched successfully.',
      await this.experienceDatabase.getMarketplaceCompareState(user.id),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('compare')
  async updateMarketplaceCompare(
    @Body() body: UpdateMarketplaceCompareDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Marketplace compare state updated successfully.',
      await this.experienceDatabase.updateMarketplaceCompareState(user.id, body.productIds),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('products/:id/status')
  async updateMarketplaceProductStatus(
    @Param('id') id: string,
    @Body() body: UpdateMarketplaceProductStatusDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Marketplace product status updated successfully.',
      await this.experienceDatabase.updateMarketplaceProductStatus(id, user.id, body.status),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('drafts')
  async getMarketplaceDrafts(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const drafts = await this.experienceDatabase.getMarketplaceDrafts(user.id);
    return successResponse('Marketplace drafts fetched successfully.', drafts, {
      count: drafts.length,
    });
  }

  @UseGuards(SessionAuthGuard)
  @Post('drafts')
  async createMarketplaceDraft(
    @Body() body: CreateMarketplaceDraftDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Marketplace draft created successfully.',
      await this.experienceDatabase.createMarketplaceDraft(user.id, body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('drafts/:id')
  async updateMarketplaceDraft(
    @Param('id') id: string,
    @Body() body: UpdateMarketplaceDraftDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Marketplace draft updated successfully.',
      await this.experienceDatabase.updateMarketplaceDraft(id, user.id, body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Delete('drafts/:id')
  async deleteMarketplaceDraft(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Marketplace draft deleted successfully.',
      await this.experienceDatabase.deleteMarketplaceDraft(id, user.id),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('seller-follows')
  async getMarketplaceSellerFollows(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const follows = await this.experienceDatabase.listMarketplaceSellerFollows(user.id);
    return successResponse('Marketplace seller follows fetched successfully.', follows, {
      count: follows.length,
    });
  }

  @UseGuards(SessionAuthGuard)
  @Post('sellers/:sellerId/follow')
  async followMarketplaceSeller(
    @Param('sellerId') sellerId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Marketplace seller followed successfully.',
      await this.experienceDatabase.followMarketplaceSeller(user.id, sellerId),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Delete('sellers/:sellerId/follow')
  async unfollowMarketplaceSeller(
    @Param('sellerId') sellerId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Marketplace seller unfollowed successfully.',
      await this.experienceDatabase.unfollowMarketplaceSeller(user.id, sellerId),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('products/:id/chat')
  async getMarketplaceProductChat(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const payload = await this.experienceDatabase.listMarketplaceProductChat(id, user.id);
    return successResponse('Marketplace chat fetched successfully.', payload, {
      count: payload.messages.length,
    });
  }

  @UseGuards(SessionAuthGuard)
  @Post('products/:id/chat/messages')
  async createMarketplaceProductMessage(
    @Param('id') id: string,
    @Body() body: CreateMarketplaceMessageDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization, body.buyerId);
    return successResponse(
      'Marketplace chat message created successfully.',
      await this.experienceDatabase.createMarketplaceProductMessage(id, user.id, body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('products/:id/offers')
  async getMarketplaceOffers(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const offers = await this.experienceDatabase.listMarketplaceOffers(id, user.id);
    return successResponse('Marketplace offers fetched successfully.', offers, {
      count: offers.length,
    });
  }

  @UseGuards(SessionAuthGuard)
  @Post('products/:id/offers')
  async createMarketplaceOffer(
    @Param('id') id: string,
    @Body() body: CreateMarketplaceOfferDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization, body.buyerId);
    return successResponse(
      'Marketplace offer created successfully.',
      await this.experienceDatabase.createMarketplaceOffer(id, user.id, body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('offers/:id')
  async updateMarketplaceOffer(
    @Param('id') id: string,
    @Body() body: UpdateMarketplaceOfferDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Marketplace offer updated successfully.',
      await this.experienceDatabase.updateMarketplaceOffer(id, user.id, body),
    );
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
    this.coreDatabase.assertUserCanCreateMarketplaceProducts(seller);
    return successResponse(
      'Marketplace product created successfully.',
      await this.experienceDatabase.createMarketplaceProduct({
      ...body,
      sellerId: seller.id,
      }),
    );
  }
}
