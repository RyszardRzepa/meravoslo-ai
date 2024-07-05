'use client'

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { IconFilter } from "@/components/ui/icons";

const FilterComponent = ({ filters, setFilters, onClose }) => {
  const [open, setOpen] = useState(false);

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value,
    }));
  };

  return (
    <Sheet open={open} onOpenChange={() => setOpen(!open)}>
      <SheetTrigger asChild>
        <Button className="rounded-full p-2">
          <IconFilter/>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <div className="p-6 border rounded-2xl bg-white shadow-lg transition-all duration-300 ease-in-out">
          <SheetHeader>
            <div className="flex justify-between items-center mb-4">
              <SheetTitle className="text-xl font-semibold">Filters</SheetTitle>
              <Button onClick={onClose} variant="ghost" className="rounded-full p-1">
                <X size={20} />
              </Button>
            </div>
          </SheetHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="price-range" className="text-sm font-medium mb-2 block">
                Price Range: {filters.priceRange.map(p => '$'.repeat(p)).join(' - ')}
              </Label>
              <Slider
                id="price-range"
                min={1}
                max={4}
                step={1}
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>$</span>
                <span>$$</span>
                <span>$$$</span>
                <span>$$$$</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Cuisines</Label>
              <div className="space-y-2">
                {Object.entries(filters.cuisines).map(([cuisine, isSelected]) => (
                  <div key={cuisine} className="flex items-center justify-between">
                    <Label htmlFor={`cuisine-${cuisine}`} className="text-sm">{cuisine}</Label>
                    <Switch
                      id={`cuisine-${cuisine}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleFilterChange('cuisines', { ...filters.cuisines, [cuisine]: checked })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="rating" className="text-sm font-medium mb-2 block">
                Minimum Rating: {filters.rating}+ Stars
              </Label>
              <Slider
                id="rating"
                min={1}
                max={5}
                step={1}
                value={[filters.rating]}
                onValueChange={(value) => handleFilterChange('rating', value[0])}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterComponent;
