import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCreateCollection } from "@/api/collection/query-hooks.ts";
import type { CreateCollectionRequest } from "@/api/collection/api.ts";
import { useProducts } from "@/api/product/query-hooks.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import CollectionInfoForm, {
  EMPTY_COLLECTION_INFO_FORM_VALUE,
  type CollectionInfoFormValue,
} from "./CollectionInfoForm.tsx";

export default function CreateCollectionPage() {
  const navigate = useNavigate();
  const createCollectionMutation = useCreateCollection();
  const productsQuery = useProducts();

  const [value, setValue] = useState<CollectionInfoFormValue>(
    EMPTY_COLLECTION_INFO_FORM_VALUE,
  );

  const canSave =
    value.slug.trim().length > 0 &&
    value.titleEn.trim().length > 0 &&
    value.titleVi.trim().length > 0 &&
    value.shortDescriptionEn.trim().length > 0 &&
    value.shortDescriptionVi.trim().length > 0;

  function handleSave() {
    const imgUrl = value.imgUrl.trim();
    const productIds = value.productIds.filter(Boolean);

    const request: CreateCollectionRequest = {
      slug: value.slug.trim(),
      type: value.type,
      title: { en: value.titleEn.trim(), vi: value.titleVi.trim() },
      shortDescription: {
        en: value.shortDescriptionEn.trim(),
        vi: value.shortDescriptionVi.trim(),
      },
      imgUrl: imgUrl || undefined,
      isActive: value.isActive,
      priority: Number(value.priority) || 0,
      productIds: productIds.length > 0 ? productIds : undefined,
    };

    createCollectionMutation.mutate(request, {
      onSuccess: () => {
        toast.success(`Created collection successfully!`);
        navigate("/collections");
      },
      onError: (error) => {
        toast.error(
          isAxiosError(error) && typeof error.response?.data === "string"
            ? error.response.data
            : "Failed to create collection",
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
          onClick={() => navigate("/collections")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-medium">New Collection</h1>

        <Button
          type="button"
          className="ml-auto"
          disabled={!canSave || createCollectionMutation.isPending}
          onClick={handleSave}
        >
          {createCollectionMutation.isPending ? (
            <Spinner />
          ) : (
            <Save className="size-4" />
          )}
          Save
        </Button>
      </div>

      <CollectionInfoForm
        value={value}
        onChange={setValue}
        products={productsQuery.data ?? []}
      />
    </div>
  );
}
