import { useEffect, useState } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useDeleteProduct, useProduct, useUpdateProduct } from "@/api/product/query-hooks.ts";
import type { ProductDetail, UpdateProductRequest } from "@/api/product/api.ts";
import type { ItemAttribute } from "@/api/item/api.ts";
import { useItems } from "@/api/item/query-hooks.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import ProductInfoForm, { type ProductInfoFormValue } from "./ProductInfoForm.tsx";

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productQuery = useProduct(id ?? "");
  const updateProductMutation = useUpdateProduct();
  const itemsQuery = useItems();

  const [value, setValue] = useState<ProductInfoFormValue | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductDetail | null>(null);

  // seed form từ product khi load xong
  useEffect(() => {
    if (productQuery.data) {
      setValue(productToFormValue(productQuery.data));
    }
  }, [productQuery.data]);

  const isDirty =
    !!value &&
    !!productQuery.data &&
    JSON.stringify(value) !== JSON.stringify(productToFormValue(productQuery.data));

  const canSave =
    !!value &&
    value.slug.trim().length > 0 &&
    value.titleEn.trim().length > 0 &&
    value.titleVi.trim().length > 0 &&
    value.shortDescriptionEn.trim().length > 0 &&
    value.shortDescriptionVi.trim().length > 0 &&
    isDirty;

  function handleSave() {
    if (!id || !value) return;

    const requiredAttributes: ItemAttribute[] = [];
    if (value.colorRequired) requiredAttributes.push("COLOR");
    if (value.sizeRequired) requiredAttributes.push("SIZE");

    const imgUrls = value.imgUrls.map((u) => u.trim()).filter(Boolean);
    const itemIds = value.itemIds.filter(Boolean);
    const markdownEn = value.markdownDescriptionEn.trim();
    const markdownVi = value.markdownDescriptionVi.trim();

    const request: UpdateProductRequest = {
      slug: value.slug.trim(),
      title: { en: value.titleEn.trim(), vi: value.titleVi.trim() },
      shortDescription: {
        en: value.shortDescriptionEn.trim(),
        vi: value.shortDescriptionVi.trim(),
      },
      markdownDescription:
        markdownEn && markdownVi ? { en: markdownEn, vi: markdownVi } : undefined,
      imgUrls: imgUrls.length > 0 ? imgUrls : undefined,
      displayPrice: undefined,
      comparePrice: value.comparePriceEnabled ? Number(value.comparePrice || "0") : undefined,
      status: value.status,
      requiredAttributes: requiredAttributes,
      itemIds: itemIds,
    };

    updateProductMutation.mutate(
      { productId: id, request },
      {
        onSuccess: (product) => {
          toast.success(`Updated product ${product.title.en}`);
          navigate("/products");
        },
        onError: (error) => {
          toast.error(
            isAxiosError(error) && typeof error.response?.data === "string"
              ? error.response.data
              : "Failed to update product",
          );
        },
      },
    );
  }

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => navigate("/products")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-medium">Product Detail</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="ml-auto">
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              disabled={!productQuery.data}
              onClick={() => productQuery.data && setDeletingProduct(productQuery.data)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          disabled={!canSave || updateProductMutation.isPending}
          onClick={handleSave}
        >
          {updateProductMutation.isPending ? (
            <Spinner />
          ) : (
            <Save className="size-4" />
          )}
          Save
        </Button>
      </div>

      {productQuery.isError ? (
        <div className="bg-card text-destructive rounded-md border p-6 text-sm">
          Failed to load product.
        </div>
      ) : !value ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <ProductInfoForm value={value} onChange={setValue} items={itemsQuery.data ?? []} />
      )}

      <DeleteProductDialog
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
      />
    </div>
  );
}

function DeleteProductDialog({
  product,
  onClose,
}: {
  product: ProductDetail | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const deleteProductMutation = useDeleteProduct();

  return (
    <Dialog open={!!product} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete product</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-xs">
          This will permanently delete{" "}
          <span className="text-foreground font-medium">{product?.title.en}</span>. This
          action cannot be undone.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteProductMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteProductMutation.isPending}
            onClick={() => {
              if (!product) return;
              deleteProductMutation.mutate(product.id, {
                onSuccess: () => {
                  toast.success(`Deleted product ${product.title.en}`);
                  navigate("/products");
                },
                onError: (error) => {
                  toast.error(
                    isAxiosError(error) && typeof error.response?.data === "string"
                      ? error.response.data
                      : "Failed to delete product",
                  );
                },
              });
            }}
          >
            {deleteProductMutation.isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function productToFormValue(product: ProductDetail): ProductInfoFormValue {
  return {
    slug: product.slug,
    titleEn: product.title.en,
    titleVi: product.title.vi,
    shortDescriptionEn: product.shortDescription.en,
    shortDescriptionVi: product.shortDescription.vi,
    markdownDescriptionEn: product.markdownDescription?.en ?? "",
    markdownDescriptionVi: product.markdownDescription?.vi ?? "",
    imgUrls: product.imgUrls ?? [],
    comparePrice: product.comparePrice ?? "",
    comparePriceEnabled: product.comparePrice !== null,
    status: product.status,
    colorRequired: product.requiredAttributes.includes("COLOR"),
    sizeRequired: product.requiredAttributes.includes("SIZE"),
    itemIds: product.items.map((item) => item.id),
  };
}
