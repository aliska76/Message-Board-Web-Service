import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context, limit, ttl, throttler } = requestProps;

        // For test mode
        if (process.env.NODE_ENV === 'test') {
            return true;
        }

        return super.handleRequest(requestProps);
    }

    protected async getTracker(req: Record<string, any>): Promise<string> {
        // For test mode req.ip
        if (process.env.NODE_ENV === 'test') {
            return req.ip;
        }

        // For poduction mode - proxy headers
        if (req.headers['x-forwarded-for']) {
            return req.headers['x-forwarded-for'].split(',')[0].trim();
        }

        return req.ips?.length ? req.ips[0] : req.ip; // individualize IP extraction to meet your own needs
    }
}