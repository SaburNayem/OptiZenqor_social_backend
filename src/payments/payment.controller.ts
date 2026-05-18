import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentGateway } from './payment.enums';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Post('create')
  @ApiBearerAuth('user-bearer')
  @ApiOperation({ summary: 'Create a payment and return a gateway checkout URL' })
  @ApiBody({ type: CreatePaymentDto })
  async createPayment(
    @Body() body: CreatePaymentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Payment checkout created successfully.',
      await this.paymentService.createPayment(body, user),
    );
  }

  @Post('sslcommerz/ipn')
  @HttpCode(200)
  @ApiOperation({ summary: 'SSLCommerz IPN endpoint' })
  async sslCommerzIpn(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, unknown>,
  ) {
    return successResponse(
      'SSLCommerz IPN processed successfully.',
      await this.paymentService.handleWebhook(PaymentGateway.SSLCommerz, { body, headers }),
    );
  }

  @Post('2checkout/webhook')
  @HttpCode(200)
  @ApiOperation({ summary: '2Checkout / Verifone webhook endpoint' })
  async twoCheckoutWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, unknown>,
    @Res() response: any,
  ) {
    const result = await this.paymentService.handleWebhook(PaymentGateway.TwoCheckout, {
      body,
      headers,
    });
    if (result.responseBody) {
      response.type('text/xml').send(result.responseBody);
      return;
    }
    response.json(successResponse('2Checkout webhook processed successfully.', result));
  }

  @Get('success')
  @ApiOperation({ summary: 'Gateway success redirect endpoint' })
  async successRedirect(@Query('paymentId') paymentId: string, @Res() response: any) {
    if (paymentId) {
      await this.paymentService.markReturnState(paymentId, 'success');
    }
    response.type('html').send(this.returnHtml('Payment submitted', paymentId));
  }

  @Get('fail')
  @ApiOperation({ summary: 'Gateway failed redirect endpoint' })
  async failRedirect(@Query('paymentId') paymentId: string, @Res() response: any) {
    if (paymentId) {
      await this.paymentService.markReturnState(paymentId, 'fail');
    }
    response.type('html').send(this.returnHtml('Payment failed', paymentId));
  }

  @Get('cancel')
  @ApiOperation({ summary: 'Gateway cancelled redirect endpoint' })
  async cancelRedirect(@Query('paymentId') paymentId: string, @Res() response: any) {
    if (paymentId) {
      await this.paymentService.markReturnState(paymentId, 'cancel');
    }
    response.type('html').send(this.returnHtml('Payment cancelled', paymentId));
  }

  @Get(':id/status')
  @ApiBearerAuth('user-bearer')
  @ApiOperation({ summary: 'Fetch payment status' })
  @ApiParam({ name: 'id', example: 'payment_xxxxx' })
  async getStatus(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Payment status fetched successfully.',
      await this.paymentService.getPaymentStatus(id, user.id),
    );
  }

  private returnHtml(title: string, paymentId?: string) {
    const frontendBaseUrl =
      process.env.PAYMENT_FRONTEND_RETURN_URL?.trim() ||
      process.env.FRONTEND_URL?.trim() ||
      '';
    const appDeepLink = process.env.MOBILE_APP_SCHEME?.trim()
      ? `${process.env.MOBILE_APP_SCHEME?.trim()}://payments/status${paymentId ? `?paymentId=${encodeURIComponent(paymentId)}` : ''}`
      : '';
    const webUrl = frontendBaseUrl
      ? `${frontendBaseUrl.replace(/\/+$/, '')}/payments/status${paymentId ? `?paymentId=${encodeURIComponent(paymentId)}` : ''}`
      : '';
    const redirectTarget = webUrl || appDeepLink;
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    <main style="font-family:Arial,sans-serif;max-width:520px;margin:56px auto;padding:24px;">
      <h1>${title}</h1>
      <p>Your payment status will be confirmed after gateway verification.</p>
      ${paymentId ? `<p>Payment ID: <strong>${paymentId}</strong></p>` : ''}
      ${redirectTarget ? `<p><a href="${redirectTarget}">Return to app</a></p>` : ''}
    </main>
    ${redirectTarget ? `<script>setTimeout(function(){ window.location.href = ${JSON.stringify(redirectTarget)}; }, 1200);</script>` : ''}
  </body>
</html>`;
  }
}
