import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Product } from "@/types/product";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { productSchema } from "@/lib/validations/product";
import { FormField } from "@/components/common/FormField";
import { toast } from "sonner";

interface ProductFormDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Partial<Product>) => void;
}

export function ProductFormDialog({ product, open, onOpenChange, onSave }: ProductFormDialogProps) {
  const {
    data,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    getFieldError,
  } = useFormValidation(productSchema, product || undefined);

  useEffect(() => {
    if (open) {
      resetForm(product || {
        sku: "",
        name: "",
        description: "",
        category: "other",
        status: "active",
        currentStock: 0,
        reorderLevel: 10,
        unit: "piece",
        costPrice: 0,
        sellingPrice: 0,
        supplier: "",
      });
    }
  }, [product, open, resetForm]);

  const calculateMarkup = (cost: number, selling: number) => {
    if (cost === 0) return 0;
    return ((selling - cost) / cost) * 100;
  };

  const handleCostPriceChange = (value: number) => {
    handleChange("costPrice", value);
  };

  const handleSellingPriceChange = (value: number) => {
    handleChange("sellingPrice", value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = validateForm();
    if (!result.success) {
      toast.error("Please fix the validation errors");
      return;
    }

    onSave(data as Partial<Product>);
    toast.success(
      product ? "Product updated successfully" : "Product created successfully"
    );
    onOpenChange(false);
  };

  const markup = calculateMarkup(data.costPrice || 0, data.sellingPrice || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="supplier">Supplier</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <FormField label="SKU" name="sku" required error={getFieldError("sku")} helpText="Unique product identifier">
                <Input
                  id="sku"
                  value={data.sku || ""}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  onBlur={() => handleBlur("sku")}
                />
              </FormField>

              <FormField label="Product Name" name="name" required error={getFieldError("name")}>
                <Input
                  id="name"
                  value={data.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                />
              </FormField>

              <FormField label="Description" name="description" error={getFieldError("description")}>
                <Textarea
                  id="description"
                  value={data.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  onBlur={() => handleBlur("description")}
                  rows={3}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Category" name="category" required error={getFieldError("category")}>
                  <Select
                    value={data.category || "other"}
                    onValueChange={(value) => handleChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="food">Food & Beverage</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Status" name="status" required error={getFieldError("status")}>
                  <Select
                    value={data.status || "active"}
                    onValueChange={(value) => handleChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <FormField label="Cost Price" name="costPrice" required error={getFieldError("costPrice")}>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={data.costPrice || ""}
                  onChange={(e) => handleCostPriceChange(parseFloat(e.target.value) || 0)}
                  onBlur={() => handleBlur("costPrice")}
                />
              </FormField>

              <FormField label="Selling Price" name="sellingPrice" required error={getFieldError("sellingPrice")}>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  value={data.sellingPrice || ""}
                  onChange={(e) => handleSellingPriceChange(parseFloat(e.target.value) || 0)}
                  onBlur={() => handleBlur("sellingPrice")}
                />
              </FormField>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Markup Percentage</div>
                <div className="text-2xl font-bold">{markup.toFixed(2)}%</div>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4 mt-4">
              <FormField label="Current Stock" name="currentStock" required error={getFieldError("currentStock")}>
                <Input
                  id="currentStock"
                  type="number"
                  value={data.currentStock || ""}
                  onChange={(e) => handleChange("currentStock", parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur("currentStock")}
                />
              </FormField>

              <FormField label="Reorder Level" name="reorderLevel" required error={getFieldError("reorderLevel")} helpText="Alert when stock falls below this level">
                <Input
                  id="reorderLevel"
                  type="number"
                  value={data.reorderLevel || ""}
                  onChange={(e) => handleChange("reorderLevel", parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur("reorderLevel")}
                />
              </FormField>

              <FormField label="Unit of Measure" name="unit" required error={getFieldError("unit")}>
                <Select
                  value={data.unit || "piece"}
                  onValueChange={(value) => handleChange("unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </TabsContent>

            <TabsContent value="supplier" className="space-y-4 mt-4">
              <FormField label="Supplier Name" name="supplier" error={getFieldError("supplier")}>
                <Input
                  id="supplier"
                  value={data.supplier || ""}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  onBlur={() => handleBlur("supplier")}
                />
              </FormField>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {product ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
