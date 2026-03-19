/**
 * Product Card Component
 * Displays product information with animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Store, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/services/api';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card 
        className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow duration-300"
        onClick={onClick}
      >
        {/* Product Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          {product.imageUrl ? (
            <motion.img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <Store className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Stock Badge */}
          {product.stock <= 5 && product.stock > 0 && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Only {product.stock} left
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="secondary" className="absolute top-2 left-2">
              Out of Stock
            </Badge>
          )}

          {/* Category Badge */}
          {product.category && (
            <Badge variant="secondary" className="absolute top-2 right-2">
              {product.category}
            </Badge>
          )}

          {/* Quick Add Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              View Details
            </Button>
          </motion.div>
        </div>

        <CardContent className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Store Name */}
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Store className="h-3 w-3" />
            {product.storeName}
          </p>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {product.description}
            </p>
          )}

          {/* Price and Distance */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-xl font-bold text-primary">
                {formatPrice(product.price)}
              </p>
              {product.stock > 0 && (
                <p className="text-xs text-muted-foreground">
                  {product.stock} in stock
                </p>
              )}
            </div>
            
            {product.distance !== undefined && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{product.distance.toFixed(1)} km</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
