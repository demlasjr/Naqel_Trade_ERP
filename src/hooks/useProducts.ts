import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { toast } from "sonner";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          vendor:vendors(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = (data || []).map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description || "",
        category: p.category,
        status: p.status,
        stockQuantity: p.stock_quantity,
        lowStockThreshold: p.low_stock_threshold,
        reorderPoint: p.reorder_point,
        unit: p.unit,
        costPrice: p.cost_price,
        sellingPrice: p.selling_price,
        markup: p.markup,
        supplierId: p.supplier_id || undefined,
        supplierName: p.vendor?.name || undefined,
        supplierSku: p.supplier_sku || undefined,
        barcode: p.barcode || undefined,
        imageUrl: p.image_url || undefined,
        location: p.location || undefined,
        weight: p.weight || undefined,
        dimensions: p.dimensions || undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at || undefined,
        createdBy: p.created_by || "System",
      }));

      setProducts(mappedProducts);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const markup = productData.costPrice && productData.sellingPrice
        ? ((productData.sellingPrice - productData.costPrice) / productData.costPrice) * 100
        : 0;

      const { data, error } = await supabase
        .from("products")
        .insert({
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          category: productData.category,
          status: productData.status || "active",
          stock_quantity: productData.stockQuantity || 0,
          low_stock_threshold: productData.lowStockThreshold || 10,
          reorder_point: productData.reorderPoint || 15,
          unit: productData.unit || "piece",
          cost_price: productData.costPrice || 0,
          selling_price: productData.sellingPrice || 0,
          markup: markup,
          supplier_id: productData.supplierId,
          supplier_sku: productData.supplierSku,
          barcode: productData.barcode,
          image_url: productData.imageUrl,
          location: productData.location,
          weight: productData.weight,
          dimensions: productData.dimensions,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Product created successfully");
      await fetchProducts();
      return data;
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(error.message || "Failed to create product");
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const markup = productData.costPrice && productData.sellingPrice
        ? ((productData.sellingPrice - productData.costPrice) / productData.costPrice) * 100
        : undefined;

      const { error } = await supabase
        .from("products")
        .update({
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          category: productData.category,
          status: productData.status,
          stock_quantity: productData.stockQuantity,
          low_stock_threshold: productData.lowStockThreshold,
          reorder_point: productData.reorderPoint,
          unit: productData.unit,
          cost_price: productData.costPrice,
          selling_price: productData.sellingPrice,
          markup: markup,
          supplier_id: productData.supplierId,
          supplier_sku: productData.supplierSku,
          barcode: productData.barcode,
          image_url: productData.imageUrl,
          location: productData.location,
          weight: productData.weight,
          dimensions: productData.dimensions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Product updated successfully");
      await fetchProducts();
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error(error.message || "Failed to update product");
      throw error;
    }
  };

  const deleteProducts = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", ids);

      if (error) throw error;

      toast.success(`${ids.length} product(s) deleted successfully`);
      await fetchProducts();
    } catch (error: any) {
      console.error("Error deleting products:", error);
      toast.error(error.message || "Failed to delete products");
      throw error;
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: "active" | "inactive" | "discontinued") => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw error;

      const statusText = status === "active" ? "activated" : status === "inactive" ? "deactivated" : "discontinued";
      toast.success(`${ids.length} product(s) ${statusText} successfully`);
      await fetchProducts();
    } catch (error: any) {
      console.error("Error updating product status:", error);
      toast.error(error.message || "Failed to update product status");
      throw error;
    }
  };

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProducts,
    bulkUpdateStatus,
    refetch: fetchProducts,
  };
}
