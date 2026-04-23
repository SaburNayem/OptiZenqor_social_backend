import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { CreateMarketplaceOrderDto, CreateProductDto } from '../dto/api.dto';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly extendedData: ExtendedDataService,
    private readonly appExtensionsData: AppExtensionsDataService,
  ) {}

  private buildSellerProfile(sellerId: string) {
    const seller = this.platformData.getUser(sellerId);
    const products = this.platformData
      .getProducts()
      .filter((item) => item.sellerId === sellerId);

    return {
      id: seller.id,
      name: seller.name,
      username: seller.username,
      avatar: seller.avatar,
      bio: seller.bio,
      verified: seller.verification === 'Verified',
      role: seller.role,
      followers: seller.followers,
      following: seller.following,
      activeListings: products.length,
      completedOrders: Math.max(0, products.length * 12),
      storeName: seller.name,
      strikeStatus: seller.status === 'Suspended' ? 'Under review' : 'No warnings',
    };
  }

  private buildMarketplacePayload() {
    const products = this.platformData.getProducts();
    const categories = this.extendedData.getMasterData().marketplaceCategories;
    const workspace = this.appExtensionsData.getMarketplaceWorkspace();
    const sellers = [...new Set(products.map((item) => item.sellerId))].map((sellerId) =>
      this.buildSellerProfile(sellerId),
    );

    return {
      totalProducts: products.length,
      products,
      items: products,
      categories,
      sellers,
      savedItemIds: workspace.savedItemIds,
      followedSellerIds: workspace.followedSellerIds,
      savedSearches: workspace.savedSearches,
      recentSearches: workspace.recentSearches,
      trendingSearches: workspace.trendingSearches,
      notifications: workspace.notifications,
      blockedKeywords: workspace.blockedKeywords,
      chatMessages: workspace.chatMessages,
      offerHistory: workspace.offerHistory,
      orders: workspace.orders,
      featuredProducts: products.slice(0, 5),
      trendingProducts: products
        .slice()
        .sort((left, right) => right.watchers - left.watchers)
        .slice(0, 5),
      recommendedProducts: products
        .slice()
        .sort((left, right) => right.views - left.views)
        .slice(0, 8),
      workspace,
    };
  }

  @Get()
  getMarketplaceOverview() {
    const payload = this.buildMarketplacePayload();
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
    const products = this.platformData.getProducts();
    return {
      categories: this.extendedData.getMasterData().marketplaceCategories,
      conditions: [...new Set(products.map((item) => item.condition))],
      sellerProfiles: [...new Set(products.map((item) => item.sellerId))].map((sellerId) =>
        this.buildSellerProfile(sellerId),
      ),
      deliveryMethods: ['Pickup', 'Shipping', 'Local delivery'],
      paymentMethods: ['Cash on delivery', 'Wallet', 'Card'],
      moderationNotes: [
        'Avoid prohibited items and misleading titles.',
        'Use clear photos and accurate condition details.',
      ],
    };
  }

  @Get('detail')
  getMarketplaceDetail(@Query('id') id: string) {
    return this.getMarketplaceDetailById(id);
  }

  @Get('detail/:id')
  getMarketplaceDetailById(@Param('id') id: string) {
    const product = this.platformData.getProduct(id);
    const workspace = this.appExtensionsData.getMarketplaceWorkspace();
    return {
      product,
      seller: this.buildSellerProfile(product.sellerId),
      relatedProducts: this.platformData
        .getProducts()
        .filter((item) => item.id !== id && item.category === product.category)
        .slice(0, 6),
      saved: workspace.savedItemIds.includes(id),
      sellerFollowed: workspace.followedSellerIds.includes(product.sellerId),
      chatMessages: workspace.chatMessages.filter(
        (message) =>
          !message.productTitle ||
          message.productTitle.toLowerCase() === product.title.toLowerCase(),
      ),
      offerHistory: workspace.offerHistory,
      orderHistory: workspace.orders.filter((order) => order.productId === id),
    };
  }

  @Get('checkout')
  getMarketplaceCheckout(@Query('id') id: string) {
    const product = this.platformData.getProduct(id);
    const workspace = this.appExtensionsData.getMarketplaceWorkspace();
    return {
      product,
      checkoutDefaults: {
        address: workspace.orders[0]?.address ?? 'House 14, Road 7, Dhanmondi, Dhaka',
        deliveryMethod: workspace.orders[0]?.deliveryMethod ?? 'Home delivery',
        paymentMethod: workspace.orders[0]?.paymentMethod ?? 'Cash on delivery',
      },
      deliveryMethods: ['Home delivery', 'Pickup arranged', 'Courier shipping'],
      paymentMethods: ['Cash on delivery', 'Wallet', 'Card'],
      recentOrders: workspace.orders.slice(0, 5),
    };
  }

  @Post('checkout')
  createMarketplaceOrder(@Body() body: CreateMarketplaceOrderDto) {
    const product = this.platformData.getProduct(body.productId);
    return this.appExtensionsData.createMarketplaceOrder({
      productId: product.id,
      productTitle: product.title,
      amount: product.price,
      address: body.address,
      deliveryMethod: body.deliveryMethod,
      paymentMethod: body.paymentMethod,
    });
  }

  @Get('products')
  getProducts() {
    return this.platformData.getProducts();
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.platformData.getProduct(id);
  }

  @Post('create')
  createProductAlias(@Body() body: CreateProductDto) {
    return this.createProduct(body);
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
