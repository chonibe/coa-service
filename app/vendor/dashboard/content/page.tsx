'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArtistStoryWizard } from '@/components/vendor/wizard/ArtistStoryWizard';
import { ProductBenefitWizard } from '@/components/vendor/wizard/ProductBenefitWizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VendorContentDashboard() {
  const [activeTab, setActiveTab] = useState('stories');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Content Management</h1>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stories">Artist Stories</TabsTrigger>
          <TabsTrigger value="benefits">Product Benefits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stories">
          <Card>
            <CardHeader>
              <CardTitle>Create Artist Story</CardTitle>
            </CardHeader>
            <CardContent>
              <ArtistStoryWizard />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Create Product Benefit</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductBenefitWizard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 