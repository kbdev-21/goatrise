import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCreateProduct } from "@/api/product/query-hooks.ts";
import type { CreateProductRequest } from "@/api/product/api.ts";
import type { ItemAttribute } from "@/api/item/api.ts";
import { useItems } from "@/api/item/query-hooks.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import ProductInfoForm, {
  EMPTY_PRODUCT_INFO_FORM_VALUE,
  type ProductInfoFormValue,
} from "./ProductInfoForm.tsx";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const createProductMutation = useCreateProduct();
  const itemsQuery = useItems();

  const [value, setValue] = useState<ProductInfoFormValue>(EMPTY_PRODUCT_INFO_FORM_VALUE);

  const canSave =
    value.slug.trim().length > 0 &&
    value.titleEn.trim().length > 0 &&
    value.titleVi.trim().length > 0 &&
    value.shortDescriptionEn.trim().length > 0 &&
    value.shortDescriptionVi.trim().length > 0;

  function handleSave() {
    const requiredAttributes: ItemAttribute[] = [];
    if (value.colorRequired) requiredAttributes.push("COLOR");
    if (value.sizeRequired) requiredAttributes.push("SIZE");

    const imgUrls = value.imgUrls.map((u) => u.trim()).filter(Boolean);
    const itemIds = value.itemIds.filter(Boolean);
    const markdownEn = value.markdownDescriptionEn.trim();
    const markdownVi = value.markdownDescriptionVi.trim();

    const request: CreateProductRequest = {
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
      itemIds: itemIds.length > 0 ? itemIds : undefined,
    };

    createProductMutation.mutate(request, {
      onSuccess: () => {
        toast.success(`Created product successfully!`);
        navigate("/products");
      },
      onError: (error) => {
        toast.error(
          isAxiosError(error) && typeof error.response?.data === "string"
            ? error.response.data
            : "Failed to create product",
        );
      },
    });
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
        <h1 className="text-2xl font-medium">New Product</h1>

        <Button
          type="button"
          className="ml-auto"
          disabled={!canSave || createProductMutation.isPending}
          onClick={handleSave}
        >
          {createProductMutation.isPending ? (
            <Spinner />
          ) : (
            <Save className="size-4" />
          )}
          Save
        </Button>
      </div>

      <ProductInfoForm value={value} onChange={setValue} items={itemsQuery.data ?? []} />
    </div>
  );
}
