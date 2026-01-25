"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui"

export default function TestAuthPage() {
  const handleTestLogin = (customerId?: string) => {
    const url = customerId 
      ? `/api/auth/test-login?customer_id=${customerId}`
      : '/api/auth/test-login';
    window.location.href = url;
  };

  const handleShopifyAuth = () => {
    window.location.href = '/api/auth/shopify';
  };

  const handleClearCookies = () => {
    // Clear all relevant cookies
    document.cookie = 'shopify_customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'shopify_customer_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'shopify_customer_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'shopify_oauth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'shopify_login_redirect=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    alert('Cookies cleared! Check browser console for verification.');
    console.log('All cookies after clearing:', document.cookie);
  };

  const showCurrentState = () => {
    const cookies = document.cookie;
    const customerId = cookies
      .split('; ')
      .find(row => row.startsWith('shopify_customer_id='))
      ?.split('=')[1];
    
    console.log('Current Authentication State:', {
      allCookies: cookies,
      shopifyCustomerId: customerId,
      currentUrl: window.location.href
    });
    
    alert(`Customer ID: ${customerId || 'Not found'}\nCheck console for full details.`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Testing</CardTitle>
          <CardDescription>
            Use these tools to test the customer authentication flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold">Test Login (Bypass Shopify)</h3>
              <Button 
                onClick={() => handleTestLogin()} 
                className="w-full"
                variant="outline"
              >
                Test Login (Default Customer)
              </Button>
              <Button 
                onClick={() => handleTestLogin('23308248711554')} 
                className="w-full"
                variant="outline"
              >
                Test Login (Customer 23308248711554)
              </Button>
              <Button 
                onClick={() => handleTestLogin('6538098180323')} 
                className="w-full"
                variant="outline"
              >
                Test Login (Customer 6538098180323)
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Real Shopify Auth</h3>
              <Button 
                onClick={handleShopifyAuth} 
                className="w-full"
              >
                Start Shopify Authentication
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold">Debug Tools</h3>
            <div className="grid gap-2 md:grid-cols-2">
              <Button 
                onClick={showCurrentState} 
                variant="secondary"
                className="w-full"
              >
                Show Current State
              </Button>
              <Button 
                onClick={handleClearCookies} 
                variant="destructive"
                className="w-full"
              >
                Clear All Cookies
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Quick Links</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <Button 
                onClick={() => window.location.href = '/customer/dashboard'} 
                variant="outline"
                size="sm"
              >
                Customer Dashboard
              </Button>
              <Button 
                onClick={() => window.location.href = '/api/auth/callback?customer_id=23225839157634&state=test'} 
                variant="outline"
                size="sm"
              >
                Test Callback
              </Button>
              <Button 
                onClick={() => window.open('/api/auth/test-callback?redirect_uri=' + encodeURIComponent(window.location.origin + '/api/auth/callback') + '&state=test', '_blank')} 
                variant="outline"
                size="sm"
              >
                Test Callback Chain
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 