# 🚀 Sentry Setup Guide

This guide will help you set up Sentry for error monitoring and performance tracking in your Smart Quote Generator application.

## 📋 What is Sentry?

Sentry is an application monitoring platform that helps you:
- **Track errors** in real-time across your entire stack
- **Monitor performance** with detailed transaction traces
- **Get alerts** when things go wrong
- **Debug issues** with full context and stack traces
- **Track user experience** with session replay

## 🎯 What We've Added

### Backend (FastAPI)
- ✅ Sentry SDK with FastAPI integration
- ✅ SQLAlchemy integration for database monitoring
- ✅ Environment-based configuration
- ✅ Automatic error capture

### Frontend (Next.js)
- ✅ Sentry SDK with Next.js integration
- ✅ Error boundaries and error reporting
- ✅ Performance monitoring setup
- ✅ Environment-based configuration

## 🔧 Setup Steps

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new organization
4. Create a new project for your app

### 2. Get Your Sentry DSN

1. In your Sentry project, go to **Settings** → **Projects** → **Client Keys (DSN)**
2. Copy the DSN (Data Source Name) - it looks like: `https://abc123@sentry.io/123456`

### 3. Configure Environment Variables

#### Backend (.env)
```bash
# Sentry Configuration
SENTRY_DSN=https://your-dsn-here@sentry.io/your-project-id
ENVIRONMENT=development
```

#### Frontend (.env.local)
```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn-here@sentry.io/your-project-id
NEXT_PUBLIC_ENVIRONMENT=development
SENTRY_DSN=https://your-dsn-here@sentry.io/your-project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
ENVIRONMENT=development
```

### 4. Rebuild and Restart

```bash
# Rebuild backend with Sentry
docker-compose build backend

# Restart services
docker-compose restart backend frontend
```

## 🎨 Features

### Error Monitoring
- **Automatic Error Capture**: All unhandled exceptions are automatically captured
- **Context Information**: Errors include user info, request data, and environment details
- **Grouping**: Similar errors are grouped together for easier analysis
- **Real-time Alerts**: Get notified immediately when errors occur

### Performance Monitoring
- **Transaction Traces**: Track performance of API endpoints and database queries
- **Database Monitoring**: Monitor SQL query performance and identify bottlenecks
- **Frontend Performance**: Track page load times and user interactions
- **Custom Metrics**: Add custom performance measurements

### User Experience
- **Session Replay**: See exactly what users were doing when errors occurred
- **User Context**: Track user actions and identify problematic workflows
- **Release Tracking**: Monitor how new deployments affect error rates

## 🔍 What Gets Tracked

### Backend
- ✅ FastAPI request/response cycles
- ✅ Database query performance
- ✅ Authentication errors
- ✅ PDF generation issues
- ✅ API endpoint errors
- ✅ Database connection issues

### Frontend
- ✅ React component errors
- ✅ API call failures
- ✅ User interaction errors
- ✅ Page load performance
- ✅ Form submission errors
- ✅ PDF download issues

## 📊 Dashboard Features

Once configured, you'll see:

1. **Issues Dashboard**: All errors grouped by type and frequency
2. **Performance Dashboard**: Response times and throughput metrics
3. **Releases Dashboard**: Error rates by deployment version
4. **Users Dashboard**: Error impact on specific users
5. **Alerts**: Real-time notifications for critical issues

## 🚨 Alert Rules

Configure alerts for:
- **Error Rate Spikes**: When error rate increases by 50% in 5 minutes
- **Performance Degradation**: When response time increases by 200%
- **Critical Errors**: When specific error types occur
- **User Impact**: When errors affect more than 10% of users

## 🔧 Customization

### Add Custom Context
```typescript
// Frontend
Sentry.setUser({ id: user.id, email: user.email });
Sentry.setTag('feature', 'quote-generation');
Sentry.setExtra('quote_data', quoteData);

// Backend
sentry_sdk.set_user({"id": user.id, "email": user.email})
sentry_sdk.set_tag("tenant", tenant_id)
sentry_sdk.set_context("quote", quote_data)
```

### Custom Performance Monitoring
```typescript
// Frontend
const transaction = Sentry.startTransaction({
  name: 'custom-operation',
  op: 'custom',
});

// Backend
with sentry_sdk.start_transaction(op="custom", name="custom-operation"):
    # Your custom operation
    pass
```

## 🧪 Testing

### Test Error Reporting
1. **Frontend**: Add a test error button
2. **Backend**: Trigger a test exception
3. **Check Sentry**: Verify errors appear in your dashboard

### Test Performance Monitoring
1. **Make API calls**: Generate some traffic
2. **Check Performance tab**: Look for transaction traces
3. **Verify metrics**: Check response times and throughput

## 🚀 Production Deployment

### Environment Variables
```bash
# Production
ENVIRONMENT=production
SENTRY_DSN=https://your-production-dsn@sentry.io/project-id

# Staging
ENVIRONMENT=staging
SENTRY_DSN=https://your-staging-dsn@sentry.io/project-id
```

### Sample Rates
- **Development**: 100% (capture everything)
- **Staging**: 50% (capture half for testing)
- **Production**: 10-25% (capture subset for monitoring)

## 📈 Benefits

1. **Proactive Monitoring**: Catch issues before users report them
2. **Faster Debugging**: Full context and stack traces
3. **Performance Insights**: Identify bottlenecks and optimize
4. **User Experience**: Understand how errors affect users
5. **Release Confidence**: Monitor new deployments in real-time

## 🆘 Troubleshooting

### Common Issues
1. **DSN not working**: Check environment variable names
2. **No errors showing**: Verify DSN is correct
3. **Performance data missing**: Check sample rates
4. **Build errors**: Ensure Sentry packages are installed

### Debug Mode
Enable debug mode in development:
```bash
ENVIRONMENT=development
# Sentry will show detailed logs
```

## 🔗 Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [FastAPI Integration](https://docs.sentry.io/platforms/python/fastapi/)
- [Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

---

🎉 **You're now ready to monitor your application like a pro!** 

Set up your Sentry DSN, rebuild the containers, and start tracking errors and performance in real-time. 
